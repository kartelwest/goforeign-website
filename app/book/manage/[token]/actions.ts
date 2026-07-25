"use server";

import { z } from "zod";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { cancellationEmail, rescheduleEmail } from "@/lib/email/templates";

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find that booking.",
  not_cancellable: "This booking can no longer be cancelled.",
  not_reschedulable: "This booking can no longer be rescheduled.",
  cutoff_passed: "It's too close to your appointment time to make this change online. Please contact us directly.",
  lead_time_violation: "That time is too soon — please pick a time further out.",
  booking_window_violation: "That date is too far out to book yet.",
  slot_blocked: "That time just became unavailable. Please pick another slot.",
  "23P01": "That slot was just taken by someone else. Please pick another time.",
};

function friendlyError(error: { code?: string; message?: string }): string {
  return ERROR_MESSAGES[error.message ?? ""] ?? ERROR_MESSAGES[error.code ?? ""] ?? "Something went wrong. Please try again.";
}

async function loadClientAndService(clientId: string, serviceId: string) {
  const supabase = createServiceRoleClient();
  const [{ data: client }, { data: service }] = await Promise.all([
    supabase.from("clients").select("full_name, email").eq("id", clientId).maybeSingle(),
    supabase.from("services").select("name").eq("id", serviceId).maybeSingle(),
  ]);
  return { client, serviceName: service?.name ?? "Consultation" };
}

export type ManageActionResult = { ok: true } | { ok: false; error: string };

export async function cancelAppointment(token: string, reason: string): Promise<ManageActionResult> {
  const parsed = z.object({ token: z.string().min(10), reason: z.string().max(500).optional().or(z.literal("")) })
    .safeParse({ token, reason });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("cancel_appointment", {
    p_manage_token: parsed.data.token,
    p_reason: parsed.data.reason || null,
  });

  if (error) return { ok: false, error: friendlyError(error) };

  const appointment = Array.isArray(data) ? data[0] : data;
  if (appointment) {
    const { client, serviceName } = await loadClientAndService(appointment.client_id, appointment.service_id);
    if (client) {
      const email = cancellationEmail({
        clientName: client.full_name,
        serviceName,
        startsAtIso: appointment.starts_at,
        clientTimezone: appointment.client_timezone,
      });
      await sendEmail({ to: client.email, subject: email.subject, html: email.html });
    }
  }

  return { ok: true };
}

export async function rescheduleAppointment(token: string, newStartsAtIso: string): Promise<ManageActionResult> {
  const parsed = z
    .object({ token: z.string().min(10), newStartsAtIso: z.string().datetime() })
    .safeParse({ token, newStartsAtIso });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("reschedule_appointment", {
    p_manage_token: parsed.data.token,
    p_new_starts_at: parsed.data.newStartsAtIso,
  });

  if (error) return { ok: false, error: friendlyError(error) };

  const appointment = Array.isArray(data) ? data[0] : data;
  if (appointment) {
    const { client, serviceName } = await loadClientAndService(appointment.client_id, appointment.service_id);
    if (client) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goforeign.com";
      const email = rescheduleEmail({
        clientName: client.full_name,
        serviceName,
        newStartsAtIso: appointment.starts_at,
        clientTimezone: appointment.client_timezone,
        manageUrl: `${siteUrl}/book/manage/${parsed.data.token}`,
      });
      await sendEmail({ to: client.email, subject: email.subject, html: email.html });
    }
  }

  return { ok: true };
}
