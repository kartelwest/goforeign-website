// Double-booking concurrency test — run once a real Supabase project is
// wired up (needs NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
// in the environment). Fires two simultaneous book_appointment RPC calls at
// the exact same slot and asserts exactly one succeeds — proving the
// appointments_no_overlap exclusion constraint, not just app logic, is what
// prevents double-booking.
//
// Usage: node scripts/test-concurrency.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const { data: services, error: servicesError } = await supabase
  .from("services")
  .select("id, slug")
  .eq("is_active", true)
  .eq("is_public", true)
  .limit(1);

if (servicesError || !services?.length) {
  console.error("Couldn't load a service to test against:", servicesError);
  process.exit(1);
}

const serviceId = services[0].id;

// 3 days out at 10:00 UTC — comfortably past lead time and inside the
// booking window for the default settings seed.
const startsAt = new Date();
startsAt.setUTCDate(startsAt.getUTCDate() + 3);
startsAt.setUTCHours(10, 0, 0, 0);

function attempt(n) {
  return supabase.rpc("book_appointment", {
    p_service_id: serviceId,
    p_starts_at: startsAt.toISOString(),
    p_full_name: `Concurrency Test ${n}`,
    p_email: `concurrency-test-${n}-${Date.now()}@example.com`,
    p_phone: null,
    p_client_timezone: "America/New_York",
    p_intake_notes: "automated concurrency test",
  });
}

const [a, b] = await Promise.all([attempt(1), attempt(2)]);

const results = [a, b];
const succeeded = results.filter((r) => !r.error);
const failed = results.filter((r) => r.error);

console.log(`Succeeded: ${succeeded.length}, Failed: ${failed.length}`);
failed.forEach((r) => console.log("  failure:", r.error.message));

if (succeeded.length === 1 && failed.length === 1) {
  console.log("PASS — exactly one booking succeeded, the other was rejected by the DB.");
  process.exit(0);
} else {
  console.error("FAIL — expected exactly one success and one failure.");
  process.exit(1);
}
