"use server";

import { z } from "zod";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/lib/booking/data";
import { logAudit } from "@/lib/admin/audit";
import { checkMessageRateLimit, checkUploadRateLimit } from "@/lib/nunu/rate-limit";
import { interpretCommand, type NuNuAction } from "@/lib/nunu/interpret-command";
import { extractScheduleFromImage, type ExtractedShift } from "@/lib/nunu/schedule-extraction";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/heic"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  proposed_action: NuNuAction | null;
  action_status: "proposed" | "confirmed" | "rejected" | null;
  created_at: string;
};

export async function getRecentMessages(): Promise<ChatMessage[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("nunu_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as unknown as ChatMessage[];
}

async function findAppointmentCandidates(clientNameHint: string, approxDateHint: string) {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("appointments")
    .select("id, starts_at, clients(full_name), services(name)")
    .in("status", ["pending", "confirmed"]);

  if (approxDateHint) {
    const day = new Date(`${approxDateHint}T00:00:00Z`);
    query = query.gte("starts_at", addDays(day, -1).toISOString()).lt("starts_at", addDays(day, 2).toISOString());
  }

  const { data } = await query;
  const nameLower = clientNameHint.trim().toLowerCase();
  if (!nameLower) return data ?? [];

  return (data ?? []).filter((a) => {
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients;
    return client?.full_name?.toLowerCase().includes(nameLower);
  });
}

export type SendMessageResult = { ok: true } | { ok: false; error: string };

const sendMessageSchema = z.string().trim().min(1).max(2000);

export async function sendMessage(text: string): Promise<SendMessageResult> {
  const admin = await requireAdmin();
  const parsed = sendMessageSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: "Message can't be empty." };

  if (!(await checkMessageRateLimit(admin.id))) {
    return { ok: false, error: "Too many messages — please wait a minute and try again." };
  }

  const supabase = createServiceRoleClient();
  await supabase.from("nunu_messages").insert({ role: "user", content: parsed.data, admin_id: admin.id });

  const business = await getBusinessSettings();
  const result = await interpretCommand(parsed.data, business.timezone);

  if (!result.ok) {
    await supabase.from("nunu_messages").insert({ role: "assistant", content: result.error, admin_id: admin.id });
    return { ok: true };
  }

  const action = result.action;

  if (action.type === "query_calendar") {
    const dayStart = new Date(`${action.date}T00:00:00Z`);
    const { data: appointments } = await supabase
      .from("appointments")
      .select("starts_at, clients(full_name), services(name)")
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", addDays(dayStart, -1).toISOString())
      .lt("starts_at", addDays(dayStart, 2).toISOString());

    const list = (appointments ?? [])
      .map((a) => {
        const client = Array.isArray(a.clients) ? a.clients[0] : a.clients;
        const service = Array.isArray(a.services) ? a.services[0] : a.services;
        return `${new Date(a.starts_at).toLocaleString()} — ${client?.full_name} (${service?.name})`;
      })
      .join("\n");

    const answer = list || "Nothing scheduled that day.";
    await supabase.from("nunu_messages").insert({ role: "assistant", content: answer, admin_id: admin.id });
    return { ok: true };
  }

  if (action.type === "unrecognized") {
    await supabase.from("nunu_messages").insert({ role: "assistant", content: action.summary, admin_id: admin.id });
    return { ok: true };
  }

  await supabase.from("nunu_messages").insert({
    role: "assistant",
    content: action.summary,
    proposed_action: action,
    action_status: "proposed",
    admin_id: admin.id,
  });

  return { ok: true };
}

export type ConfirmActionResult = { ok: true; message: string } | { ok: false; error: string };

export async function confirmAction(messageId: string): Promise<ConfirmActionResult> {
  const admin = await requireAdmin();
  const supabase = createServiceRoleClient();

  const { data: row, error } = await supabase.from("nunu_messages").select("*").eq("id", messageId).maybeSingle();
  if (error || !row || row.action_status !== "proposed") {
    return { ok: false, error: "That proposal is no longer available." };
  }

  const action = row.proposed_action as unknown as NuNuAction;
  let resultMessage: string;

  try {
    switch (action.type) {
      case "block_range": {
        for (const range of action.ranges) {
          const { data: conflicts } = await supabase
            .from("appointments")
            .select("id")
            .in("status", ["pending", "confirmed"])
            .lt("starts_at", range.ends_at)
            .gt("ends_at", range.starts_at);

          if (conflicts && conflicts.length > 0) {
            await supabase.from("nunu_messages").update({ action_status: "rejected" }).eq("id", messageId);
            return {
              ok: false,
              error: `That would collide with ${conflicts.length} booked appointment(s). Nothing was changed — handle those first.`,
            };
          }
        }

        await supabase.from("availability_blocks").insert(
          action.ranges.map((r) => ({
            starts_at: r.starts_at,
            ends_at: r.ends_at,
            label: r.label,
            source: "nunu_text" as const,
            created_by: admin.id,
          }))
        );
        resultMessage = `Blocked ${action.ranges.length} time range(s).`;
        break;
      }

      case "open_range": {
        const { data: blocks } = await supabase
          .from("availability_blocks")
          .select("id")
          .gte("starts_at", action.starts_at)
          .lte("ends_at", action.ends_at);

        if (blocks && blocks.length > 0) {
          await supabase
            .from("availability_blocks")
            .delete()
            .in("id", blocks.map((b) => b.id));
        }
        resultMessage = blocks?.length
          ? `Opened up that time — removed ${blocks.length} block(s).`
          : "No fully-contained block found in that range to remove. If a block only partially overlaps, adjust it manually in Availability.";
        break;
      }

      case "move_appointment": {
        const candidates = await findAppointmentCandidates(action.client_name_hint, action.approx_date_hint);
        if (candidates.length !== 1) {
          await supabase.from("nunu_messages").update({ action_status: "rejected" }).eq("id", messageId);
          return {
            ok: false,
            error:
              candidates.length === 0
                ? "Couldn't find a matching appointment. Try the Appointments screen directly."
                : "Found more than one matching appointment — please use the Appointments screen to pick the right one.",
          };
        }

        const { error: updateError } = await supabase
          .from("appointments")
          .update({ starts_at: action.new_starts_at })
          .eq("id", candidates[0].id);

        if (updateError) {
          const msg =
            (updateError as { code?: string }).code === "23P01"
              ? "That new time conflicts with another appointment."
              : "Couldn't reschedule that appointment.";
          await supabase.from("nunu_messages").update({ action_status: "rejected" }).eq("id", messageId);
          return { ok: false, error: msg };
        }
        resultMessage = "Appointment rescheduled.";
        break;
      }

      case "add_note": {
        const candidates = await findAppointmentCandidates(action.client_name_hint, action.approx_date_hint);
        if (candidates.length !== 1) {
          await supabase.from("nunu_messages").update({ action_status: "rejected" }).eq("id", messageId);
          return {
            ok: false,
            error:
              candidates.length === 0
                ? "Couldn't find a matching appointment. Try the Appointments screen directly."
                : "Found more than one matching appointment — please use the Appointments screen to pick the right one.",
          };
        }

        await supabase.from("appointment_notes").insert({
          appointment_id: candidates[0].id,
          body: action.note_body,
          note_type: "session",
          author_id: admin.id,
        });
        resultMessage = "Note added.";
        break;
      }

      default:
        return { ok: false, error: "That action can't be confirmed." };
    }
  } catch {
    return { ok: false, error: "Something went wrong executing that action." };
  }

  await supabase.from("nunu_messages").update({ action_status: "confirmed" }).eq("id", messageId);
  await supabase.from("nunu_messages").insert({ role: "assistant", content: resultMessage, admin_id: admin.id });

  await logAudit({
    actorType: "nunu",
    actorId: admin.id,
    action: `nunu.${action.type}`,
    entity: "nunu_message",
    entityId: messageId,
    afterData: action,
  });

  return { ok: true, message: resultMessage };
}

export async function rejectAction(messageId: string): Promise<{ ok: true }> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  await supabase.from("nunu_messages").update({ action_status: "rejected" }).eq("id", messageId);
  return { ok: true };
}

export type UploadResult =
  | { ok: true; uploadId: string; shifts: ExtractedShift[]; confidence: number; unclear: string[] }
  | { ok: false; error: string };

export async function uploadSchedule(formData: FormData): Promise<UploadResult> {
  const admin = await requireAdmin();

  if (!(await checkUploadRateLimit(admin.id))) {
    return { ok: false, error: "Too many uploads this hour — please try again later." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, or HEIC images are supported." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "That image is too large (10 MB max)." };
  }

  const supabase = createServiceRoleClient();
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const storagePath = `${admin.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const { error: uploadError } = await supabase.storage.from("nunu-uploads").upload(storagePath, bytes, {
    contentType: file.type,
  });
  if (uploadError) {
    return { ok: false, error: "Couldn't store that image. Please try again." };
  }

  const { data: uploadRow, error: insertError } = await supabase
    .from("nunu_uploads")
    .insert({
      storage_path: storagePath,
      original_name: file.name,
      mime_type: file.type,
      byte_size: file.size,
      status: "pending",
      uploaded_by: admin.id,
    })
    .select("id")
    .single();

  if (insertError || !uploadRow) {
    return { ok: false, error: "Couldn't save the upload record." };
  }

  const base64Data = Buffer.from(bytes).toString("base64");
  const extraction = await extractScheduleFromImage(base64Data, file.type);

  if (!extraction.ok) {
    await supabase
      .from("nunu_uploads")
      .update({ status: "failed", error_message: extraction.error })
      .eq("id", uploadRow.id);
    return { ok: false, error: extraction.error };
  }

  await supabase
    .from("nunu_uploads")
    .update({
      status: "parsed",
      parsed_json: extraction.extraction,
      confidence: extraction.extraction.confidence,
    })
    .eq("id", uploadRow.id);

  return {
    ok: true,
    uploadId: uploadRow.id,
    shifts: extraction.extraction.shifts,
    confidence: extraction.extraction.confidence,
    unclear: extraction.extraction.unclear,
  };
}

const applySchema = z.object({
  uploadId: z.string().uuid(),
  shifts: z.array(
    z.object({
      date: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      label: z.string(),
    })
  ),
});

export type ApplyScheduleResult =
  | { ok: true; blockedCount: number }
  | { ok: false; error: string }
  | { ok: false; conflicts: { date: string; label: string }[] };

export async function applySchedule(input: z.infer<typeof applySchema>): Promise<ApplyScheduleResult> {
  const admin = await requireAdmin();
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid schedule data." };

  const supabase = createServiceRoleClient();
  const business = await getBusinessSettings();

  const ranges = parsed.data.shifts.map((s) => ({
    starts_at: fromZonedTime(`${s.date}T${s.start_time}:00`, business.timezone).toISOString(),
    ends_at: fromZonedTime(`${s.date}T${s.end_time}:00`, business.timezone).toISOString(),
    label: s.label,
  }));

  const conflicts: { date: string; label: string }[] = [];
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const { data } = await supabase
      .from("appointments")
      .select("id")
      .in("status", ["pending", "confirmed"])
      .lt("starts_at", r.ends_at)
      .gt("ends_at", r.starts_at);
    if (data && data.length > 0) {
      conflicts.push({ date: parsed.data.shifts[i].date, label: r.label });
    }
  }

  if (conflicts.length > 0) {
    return { ok: false, conflicts };
  }

  const { error } = await supabase.from("availability_blocks").insert(
    ranges.map((r) => ({
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      label: r.label,
      source: "nunu_image" as const,
      source_ref: parsed.data.uploadId,
      created_by: admin.id,
    }))
  );

  if (error) return { ok: false, error: "Couldn't apply the schedule." };

  await supabase
    .from("nunu_uploads")
    .update({ status: "applied", applied_at: new Date().toISOString() })
    .eq("id", parsed.data.uploadId);

  await logAudit({
    actorType: "nunu",
    actorId: admin.id,
    action: "nunu.schedule_applied",
    entity: "nunu_upload",
    entityId: parsed.data.uploadId,
    afterData: { blockCount: ranges.length },
  });

  return { ok: true, blockedCount: ranges.length };
}
