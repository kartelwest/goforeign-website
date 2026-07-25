"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import { getPaymentProvider } from "@/lib/payments/manual-provider";
import type { AppointmentStatus, PaymentMethod, PaymentStatus } from "@/lib/supabase/types";

const statusSchema = z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]);
const paymentStatusSchema = z.enum(["unpaid", "deposit_paid", "paid", "refunded", "waived"]);
const paymentMethodSchema = z.enum(["zelle", "cashapp", "card", "ach", "cash", "check", "other"]);

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false as const, error: "Invalid status." };

  const supabase = createServiceRoleClient();
  const update: { status: AppointmentStatus; cancelled_at?: string } = { status: parsed.data };
  if (parsed.data === "cancelled") update.cancelled_at = new Date().toISOString();

  const { error } = await supabase.from("appointments").update(update).eq("id", appointmentId);
  if (error) return { ok: false as const, error: "Couldn't update status." };

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "appointment.status_changed",
    entity: "appointment",
    entityId: appointmentId,
    afterData: { status: parsed.data },
  });

  revalidatePath(`/admin/appointments/${appointmentId}`);
  return { ok: true as const };
}

export async function setPaymentStatus(appointmentId: string, status: PaymentStatus) {
  const admin = await requireAdmin();
  const parsed = paymentStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false as const, error: "Invalid payment status." };

  await getPaymentProvider().setAppointmentPaymentStatus(appointmentId, parsed.data);

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "appointment.payment_status_changed",
    entity: "appointment",
    entityId: appointmentId,
    afterData: { payment_status: parsed.data },
  });

  revalidatePath(`/admin/appointments/${appointmentId}`);
  return { ok: true as const };
}

const recordPaymentSchema = z.object({
  appointmentId: z.string().uuid(),
  clientId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  method: paymentMethodSchema,
  reference: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function recordPayment(input: z.infer<typeof recordPaymentSchema>) {
  const admin = await requireAdmin();
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Please check the payment details." };

  const { appointmentId, clientId, amountCents, method, reference, notes } = parsed.data;

  try {
    await getPaymentProvider().recordPayment({
      appointmentId,
      clientId,
      amountCents,
      method: method as PaymentMethod,
      reference: reference || null,
      notes: notes || null,
      recordedByAdminId: admin.id,
    });
  } catch {
    return { ok: false as const, error: "Couldn't record the payment. Please try again." };
  }

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "payment.recorded",
    entity: "appointment",
    entityId: appointmentId,
    afterData: { amount_cents: amountCents, method },
  });

  revalidatePath(`/admin/appointments/${appointmentId}`);
  return { ok: true as const };
}

const noteSchema = z.object({
  appointmentId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
  noteType: z.enum(["session", "followup", "internal"]),
});

export async function addAppointmentNote(input: z.infer<typeof noteSchema>) {
  const admin = await requireAdmin();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Note can't be empty." };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("appointment_notes").insert({
    appointment_id: parsed.data.appointmentId,
    body: parsed.data.body,
    note_type: parsed.data.noteType,
    author_id: admin.id,
  });

  if (error) return { ok: false as const, error: "Couldn't save the note." };

  await logAudit({
    actorType: "admin",
    actorId: admin.id,
    action: "appointment_note.added",
    entity: "appointment",
    entityId: parsed.data.appointmentId,
  });

  revalidatePath(`/admin/appointments/${parsed.data.appointmentId}`);
  return { ok: true as const };
}
