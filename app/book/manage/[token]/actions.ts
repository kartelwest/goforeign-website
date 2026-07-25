"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export type ManageActionResult = { ok: true } | { ok: false; error: string };

export async function cancelAppointment(token: string, reason: string): Promise<ManageActionResult> {
  const parsed = z.object({ token: z.string().min(10), reason: z.string().max(500).optional().or(z.literal("")) })
    .safeParse({ token, reason });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cancel_appointment", {
    p_manage_token: parsed.data.token,
    p_reason: parsed.data.reason || null,
  });

  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true };
}

export async function rescheduleAppointment(token: string, newStartsAtIso: string): Promise<ManageActionResult> {
  const parsed = z
    .object({ token: z.string().min(10), newStartsAtIso: z.string().datetime() })
    .safeParse({ token, newStartsAtIso });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("reschedule_appointment", {
    p_manage_token: parsed.data.token,
    p_new_starts_at: parsed.data.newStartsAtIso,
  });

  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true };
}
