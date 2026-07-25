"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  durationMinutes: z.union([z.literal(20), z.literal(30), z.literal(60)]),
  priceCents: z.number().int().min(0).nullable(),
  bufferAfterMin: z.number().int().min(0),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  sortOrder: z.number().int(),
});

export async function saveService(input: z.infer<typeof serviceSchema>) {
  const admin = await requireAdmin();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid service." };
  }

  const supabase = createServiceRoleClient();
  const row = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description || null,
    duration_minutes: parsed.data.durationMinutes,
    price_cents: parsed.data.priceCents,
    buffer_after_min: parsed.data.bufferAfterMin,
    is_active: parsed.data.isActive,
    is_public: parsed.data.isPublic,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("services").update(row).eq("id", parsed.data.id)
    : await supabase.from("services").insert(row);

  if (error) return { ok: false as const, error: "Couldn't save the service — is the slug unique?" };

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: parsed.data.id ? "service.updated" : "service.created",
    entity: "service",
    entityId: parsed.data.id ?? null,
    afterData: row,
  });

  revalidatePath("/admin/settings");
  return { ok: true as const };
}

const paymentsSettingsSchema = z.object({
  publicMessage: z.string().trim().min(1).max(1000),
  collectAtBooking: z.boolean(),
});

export async function savePaymentsSettings(input: z.infer<typeof paymentsSettingsSchema>) {
  const admin = await requireAdmin();
  const parsed = paymentsSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid settings." };

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("settings")
    .update({
      value: { public_message: parsed.data.publicMessage, collect_at_booking: parsed.data.collectAtBooking },
    })
    .eq("key", "payments");

  if (error) return { ok: false as const, error: "Couldn't save settings." };

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "settings.payments_updated",
    entity: "settings",
    entityId: null,
    afterData: parsed.data,
  });

  revalidatePath("/admin/settings");
  return { ok: true as const };
}
