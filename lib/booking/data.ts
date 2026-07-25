import { createServiceRoleClient } from "@/lib/supabase/server";
import type { BookingSettings, BusinessSettings, PaymentsSettings } from "@/lib/supabase/types";
import type { AvailabilityBlock, AvailabilityRule, BusyAppointment } from "@/lib/booking/availability";

export async function getPublicServices() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function getServiceBySlug(slug: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getSetting<T>(key: string): Promise<T> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).single();
  if (error) throw error;
  return data.value as T;
}

export const getBookingSettings = () => getSetting<BookingSettings>("booking");
export const getBusinessSettings = () => getSetting<BusinessSettings>("business");
export const getPaymentsSettings = () => getSetting<PaymentsSettings>("payments");

export async function getAvailabilityRules(): Promise<AvailabilityRule[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .select("day_of_week, start_time, end_time, timezone, is_active")
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

export async function getAvailabilityBlocks(rangeStart: Date, rangeEnd: Date): Promise<AvailabilityBlock[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("starts_at, ends_at")
    .lt("starts_at", rangeEnd.toISOString())
    .gt("ends_at", rangeStart.toISOString());

  if (error) throw error;
  return data;
}

export async function getBusyAppointments(rangeStart: Date, rangeEnd: Date): Promise<BusyAppointment[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, services(buffer_after_min)")
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", rangeEnd.toISOString())
    .gt("ends_at", rangeStart.toISOString());

  if (error) throw error;

  return (data as unknown as Array<{
    starts_at: string;
    ends_at: string;
    services: { buffer_after_min: number } | { buffer_after_min: number }[] | null;
  }>).map((row) => {
    const svc = Array.isArray(row.services) ? row.services[0] : row.services;
    return {
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      buffer_after_min: svc?.buffer_after_min ?? 10,
    };
  });
}

export async function countAppointmentsOnDay(dayStartUtc: Date, dayEndUtc: Date): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", dayStartUtc.toISOString())
    .lt("starts_at", dayEndUtc.toISOString());

  if (error) throw error;
  return count ?? 0;
}
