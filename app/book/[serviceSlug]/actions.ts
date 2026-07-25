"use server";

import { z } from "zod";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getBusinessSettings, getPaymentsSettings } from "@/lib/booking/data";
import { sendEmail } from "@/lib/email/resend";
import { bookingConfirmationEmail, bookingNotificationEmail } from "@/lib/email/templates";

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  startsAtIso: z.string().datetime(),
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  timezone: z.string().min(1).max(100),
  intakeNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type BookAppointmentInput = z.infer<typeof bookingSchema>;

export type BookAppointmentResult =
  | { ok: true; manageToken: string; confirmationCode: string }
  | { ok: false; error: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_service: "That service isn't available for booking.",
  lead_time_violation: "That time is too soon — please pick a time further out.",
  booking_window_violation: "That date is too far out to book yet.",
  slot_blocked: "That time just became unavailable. Please pick another slot.",
  "23P01": "That slot was just taken by someone else. Please pick another time.",
};

export async function bookAppointment(input: BookAppointmentInput): Promise<BookAppointmentResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form — some details are missing or invalid." };
  }

  const { serviceId, startsAtIso, fullName, email, phone, timezone, intakeNotes } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("book_appointment", {
    p_service_id: serviceId,
    p_starts_at: startsAtIso,
    p_full_name: fullName,
    p_email: email,
    p_phone: phone || null,
    p_client_timezone: timezone,
    p_intake_notes: intakeNotes || null,
  });

  if (error) {
    const code = (error as { code?: string; message?: string }).code;
    const message = ERROR_MESSAGES[error.message] ?? ERROR_MESSAGES[code ?? ""];
    return { ok: false, error: message ?? "Something went wrong booking that slot. Please try again." };
  }

  const appointment = Array.isArray(data) ? data[0] : data;

  await sendBookingEmails({
    serviceId,
    startsAtIso: appointment.starts_at,
    fullName,
    email,
    phone: phone || null,
    clientTimezone: timezone,
    intakeNotes: intakeNotes || null,
    confirmationCode: appointment.confirmation_code,
    manageToken: appointment.manage_token,
  });

  return {
    ok: true,
    manageToken: appointment.manage_token,
    confirmationCode: appointment.confirmation_code,
  };
}

async function sendBookingEmails(params: {
  serviceId: string;
  startsAtIso: string;
  fullName: string;
  email: string;
  phone: string | null;
  clientTimezone: string;
  intakeNotes: string | null;
  confirmationCode: string;
  manageToken: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goforeign.com";
  const manageUrl = `${siteUrl}/book/manage/${params.manageToken}`;

  const supabase = createServiceRoleClient();
  const [{ data: service }, business, payments] = await Promise.all([
    supabase.from("services").select("name").eq("id", params.serviceId).maybeSingle(),
    getBusinessSettings(),
    getPaymentsSettings(),
  ]);
  const serviceName = service?.name ?? "Consultation";

  const confirmation = bookingConfirmationEmail({
    clientName: params.fullName,
    serviceName,
    startsAtIso: params.startsAtIso,
    clientTimezone: params.clientTimezone,
    confirmationCode: params.confirmationCode,
    manageUrl,
    paymentMessage: payments.public_message,
  });
  await sendEmail({ to: params.email, subject: confirmation.subject, html: confirmation.html });

  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (notificationEmail) {
    const notification = bookingNotificationEmail({
      clientName: params.fullName,
      clientEmail: params.email,
      clientPhone: params.phone,
      serviceName,
      startsAtIso: params.startsAtIso,
      businessTimezone: business.timezone,
      intakeNotes: params.intakeNotes,
    });
    await sendEmail({ to: notificationEmail, subject: notification.subject, html: notification.html });
  }
}
