"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";

const dayRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isActive: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function saveWeeklyHours(rules: z.infer<typeof dayRuleSchema>[]) {
  const admin = await requireAdmin();
  const parsed = z.array(dayRuleSchema).safeParse(rules);
  if (!parsed.success) return { ok: false as const, error: "Invalid hours." };

  const supabase = createServiceRoleClient();

  const { error: deleteError } = await supabase
    .from("availability_rules")
    .delete()
    .gte("day_of_week", 0);
  if (deleteError) return { ok: false as const, error: "Couldn't update hours." };

  const active = parsed.data.filter((r) => r.isActive);
  if (active.length > 0) {
    const { error: insertError } = await supabase.from("availability_rules").insert(
      active.map((r) => ({
        day_of_week: r.dayOfWeek,
        start_time: `${r.startTime}:00`,
        end_time: `${r.endTime}:00`,
      }))
    );
    if (insertError) return { ok: false as const, error: "Couldn't update hours." };
  }

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "availability_rules.updated",
    entity: "availability_rules",
    entityId: null,
    afterData: parsed.data,
  });

  revalidatePath("/admin/availability");
  return { ok: true as const };
}

const bookingSettingsSchema = z.object({
  leadTimeHours: z.number().int().min(0),
  bookingWindowDays: z.number().int().min(1),
  slotGranularityMin: z.number().int().min(5),
  maxPerDay: z.number().int().min(1).nullable(),
  cancelCutoffHours: z.number().int().min(0),
});

export async function saveBookingSettings(input: z.infer<typeof bookingSettingsSchema>) {
  const admin = await requireAdmin();
  const parsed = bookingSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid settings." };

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("settings")
    .update({
      value: {
        lead_time_hours: parsed.data.leadTimeHours,
        booking_window_days: parsed.data.bookingWindowDays,
        slot_granularity_min: parsed.data.slotGranularityMin,
        max_per_day: parsed.data.maxPerDay,
        cancel_cutoff_hours: parsed.data.cancelCutoffHours,
      },
    })
    .eq("key", "booking");

  if (error) return { ok: false as const, error: "Couldn't save settings." };

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "settings.booking_updated",
    entity: "settings",
    entityId: null,
    afterData: parsed.data,
  });

  revalidatePath("/admin/availability");
  return { ok: true as const };
}

const blockSchema = z.object({
  startsAtIso: z.string().datetime(),
  endsAtIso: z.string().datetime(),
  allDay: z.boolean(),
  label: z.string().trim().max(200).optional().or(z.literal("")),
  force: z.boolean().default(false),
});

export async function createBlock(input: z.infer<typeof blockSchema>) {
  const admin = await requireAdmin();
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid block." };

  const { startsAtIso, endsAtIso, allDay, label, force } = parsed.data;
  if (new Date(endsAtIso) <= new Date(startsAtIso)) {
    return { ok: false as const, error: "End time must be after start time." };
  }

  const supabase = createServiceRoleClient();

  if (!force) {
    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id, starts_at, clients(full_name)")
      .in("status", ["pending", "confirmed"])
      .lt("starts_at", endsAtIso)
      .gt("ends_at", startsAtIso);

    if (conflicts && conflicts.length > 0) {
      return {
        ok: false as const,
        needsConfirmation: true as const,
        warning: `This will cancel ${conflicts.length} existing appointment(s), including ${conflicts[0].clients?.full_name ?? "a client"}. Blocking will NOT cancel them automatically — you'll need to handle those separately.`,
      };
    }
  }

  const { error } = await supabase.from("availability_blocks").insert({
    starts_at: startsAtIso,
    ends_at: endsAtIso,
    all_day: allDay,
    label: label || null,
    source: "manual",
    created_by: admin.id,
  });

  if (error) return { ok: false as const, error: "Couldn't create the block." };

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "block.created",
    entity: "availability_block",
    entityId: null,
    afterData: parsed.data,
  });

  revalidatePath("/admin/availability");
  return { ok: true as const };
}

export async function deleteBlock(id: string) {
  const admin = await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("availability_blocks").delete().eq("id", id);
  if (error) return { ok: false as const, error: "Couldn't delete the block." };

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "block.deleted",
    entity: "availability_block",
    entityId: id,
  });

  revalidatePath("/admin/availability");
  return { ok: true as const };
}
