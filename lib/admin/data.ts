import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getAppointmentsInRange(startIso: string, endIso: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, clients(full_name, email, phone), services(name, duration_minutes)")
    .gte("starts_at", startIso)
    .lt("starts_at", endIso)
    .order("starts_at");

  if (error) throw error;
  return data;
}

export async function getBlocksInRange(startIso: string, endIso: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
    .order("starts_at");

  if (error) throw error;
  return data;
}

export async function getAppointmentDetail(id: string) {
  const supabase = createServiceRoleClient();
  const [{ data: appointment, error }, { data: notes, error: notesError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*, clients(*), services(*)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("appointment_notes")
        .select("*, admin_users(display_name, email)")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("appointment_id", id).order("received_at", { ascending: false }),
    ]);

  if (error) throw error;
  if (notesError) throw notesError;
  if (paymentsError) throw paymentsError;

  return { appointment, notes: notes ?? [], payments: payments ?? [] };
}

export async function searchClients(query: string) {
  const supabase = createServiceRoleClient();
  let builder = supabase.from("clients").select("*").order("full_name").limit(50);

  if (query.trim()) {
    builder = builder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data, error } = await builder;
  if (error) throw error;
  return data;
}

export async function getClientDetail(id: string) {
  const supabase = createServiceRoleClient();
  const [{ data: client, error }, { data: appointments, error: apptError }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("appointments")
      .select("*, services(name, duration_minutes)")
      .eq("client_id", id)
      .order("starts_at", { ascending: false }),
  ]);

  if (error) throw error;
  if (apptError) throw apptError;

  return { client, appointments: appointments ?? [] };
}

export async function getAllServices() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("services").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function getAllAvailabilityRules() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .order("day_of_week");
  if (error) throw error;
  return data;
}

export async function getUpcomingBlocks() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw error;
  return data;
}
