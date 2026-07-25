import type { Metadata } from "next";
import Link from "next/link";
import { fromZonedTime } from "date-fns-tz";
import { addDays } from "date-fns";
import { getAppointmentsInRange } from "@/lib/admin/data";
import { getBusinessSettings } from "@/lib/booking/data";

export const metadata: Metadata = { title: "Today" };
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const business = await getBusinessSettings();
  const today = new Date().toISOString().slice(0, 10);
  const dayStart = fromZonedTime(`${today}T00:00:00`, business.timezone);
  const dayEnd = addDays(dayStart, 1);

  const appointments = await getAppointmentsInRange(dayStart.toISOString(), dayEnd.toISOString());
  const now = new Date();
  const next = appointments.find((a) => new Date(a.starts_at) > now && a.status !== "cancelled");

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: business.timezone,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black">Today</h1>
        <Link
          href="/admin/appointments/new"
          className="rounded-full bg-[#B8860B] px-5 py-2 text-sm font-bold text-black hover:bg-[#D4A017]"
        >
          + New Appointment
        </Link>
      </div>

      {next && (
        <div className="mb-8 rounded-2xl border border-[#C99A2E]/40 bg-[#C99A2E]/10 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C99A2E]">Next Up</p>
          <p className="mt-1 text-lg font-bold">
            {timeFormatter.format(new Date(next.starts_at))} — {next.clients?.full_name}
          </p>
          <p className="text-sm text-gray-400">{next.services?.name}</p>
        </div>
      )}

      {appointments.length === 0 ? (
        <p className="text-gray-500">Nothing on the calendar today.</p>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <Link
              key={a.id}
              href={`/admin/appointments/${a.id}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950 p-4 hover:border-[#C99A2E]/40"
            >
              <div>
                <p className="font-semibold">
                  {timeFormatter.format(new Date(a.starts_at))} — {a.clients?.full_name}
                </p>
                <p className="text-sm text-gray-500">{a.services?.name}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  a.status === "cancelled" || a.status === "no_show"
                    ? "bg-red-500/10 text-red-400"
                    : a.status === "completed"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-[#C99A2E]/10 text-[#C99A2E]"
                }`}
              >
                {a.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
