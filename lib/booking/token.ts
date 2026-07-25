import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppointmentByToken = {
  id: string;
  confirmation_code: string;
  starts_at: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  service_id: string;
  service_slug: string;
  service_name: string;
  client_full_name: string;
  client_timezone: string;
};

export async function getAppointmentByToken(token: string): Promise<AppointmentByToken | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_appointment_by_token", { p_manage_token: token });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}
