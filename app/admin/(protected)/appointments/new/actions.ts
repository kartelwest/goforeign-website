"use server";

import { z } from "zod";
import { formatInTimeZone } from "date-fns-tz";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/lib/booking/data";
import { logAudit } from "@/lib/admin/audit";

const schema = z.object({
  serviceId: z.string().uuid(),
  startsAtIso: z.string().datetime(),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  force: z.boolean().default(false),
});

export type CreateManualAppointmentInput = z.infer<typeof schema>;

export type CreateManualAppointmentResult =
  | { ok: true; appointmentId: string }
  | { ok: false; needsConfirmation: true; warning: string }
  | { ok: false; needsConfirmation?: false; error: string };

export async function createManualAppointment(
  input: CreateManualAppointmentInput
): Promise<CreateManualAppointmentResult> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form — some details are missing or invalid." };
  }

  const { serviceId, startsAtIso, fullName, email, phone, notes, force } = parsed.data;
  const supabase = createServiceRoleClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes, buffer_after_min")
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError || !service) {
    return { ok: false, error: "That service could not be found." };
  }

  const startsAt = new Date(startsAtIso);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);
  const occupiedEnd = new Date(endsAt.getTime() + service.buffer_after_min * 60_000);

  if (!force) {
    const business = await getBusinessSettings();
    const dayOfWeek = Number(formatInTimeZone(startsAt, business.timezone, "i")) % 7;
    const startTimeStr = formatInTimeZone(startsAt, business.timezone, "HH:mm:ss");

    const { data: rules } = await supabase
      .from("availability_rules")
      .select("start_time, end_time")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    const withinHours = (rules ?? []).some((r) => startTimeStr >= r.start_time && startTimeStr <= r.end_time);

    if (!withinHours) {
      return {
        ok: false,
        needsConfirmation: true,
        warning: "This time falls outside your normal recurring availability hours.",
      };
    }

    const { data: conflictingBlocks } = await supabase
      .from("availability_blocks")
      .select("id, label")
      .lt("starts_at", occupiedEnd.toISOString())
      .gt("ends_at", startsAt.toISOString());

    if (conflictingBlocks && conflictingBlocks.length > 0) {
      return {
        ok: false,
        needsConfirmation: true,
        warning: `This time overlaps a block you set (${conflictingBlocks[0].label || "blocked time"}).`,
      };
    }
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert(
      { full_name: fullName, email, phone: phone || null },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (clientError || !client) {
    return { ok: false, error: "Couldn't save the client record. Please try again." };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      client_id: client.id,
      service_id: serviceId,
      starts_at: startsAtIso,
      duration_minutes: service.duration_minutes as 20 | 30 | 60,
      intake_notes: notes || null,
      source: "admin",
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (appointmentError) {
    if (appointmentError.code === "23P01") {
      return { ok: false, error: "That time conflicts with an existing appointment." };
    }
    return { ok: false, error: "Something went wrong creating the appointment. Please try again." };
  }

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "appointment.created",
    entity: "appointment",
    entityId: appointment.id,
    afterData: { starts_at: startsAtIso, service_id: serviceId, forced: force },
  });

  return { ok: true, appointmentId: appointment.id };
}
