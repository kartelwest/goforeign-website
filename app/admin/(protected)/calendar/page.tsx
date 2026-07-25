import type { Metadata } from "next";
import Link from "next/link";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getAppointmentsInRange, getBlocksInRange } from "@/lib/admin/data";
import { getBusinessSettings } from "@/lib/booking/data";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const business = await getBusinessSettings();

  const anchor = week ? new Date(`${week}T00:00:00Z`) : new Date();
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 7);

  const [appointments, blocks] = await Promise.all([
    getAppointmentsInRange(weekStart.toISOString(), weekEnd.toISOString()),
    getBlocksInRange(weekStart.toISOString(), weekEnd.toISOString()),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: business.timezone,
  });
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: business.timezone,
  });

  const prevWeek = addDays(weekStart, -7).toISOString().slice(0, 10);
  const nextWeek = addDays(weekStart, 7).toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black">Calendar</h1>
        <div className="flex gap-3">
          <Link href={`/admin/calendar?week=${prevWeek}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold hover:border-[#C99A2E]">
            ← Prev Week
          </Link>
          <Link href={`/admin/calendar?week=${nextWeek}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold hover:border-[#C99A2E]">
            Next Week →
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {days.map((day) => {
          const dayKey = day.toISOString().slice(0, 10);
          const dayStart = fromZonedTime(`${dayKey}T00:00:00`, business.timezone);
          const dayEnd = addDays(dayStart, 1);

          const dayAppointments = appointments.filter((a) => {
            const t = new Date(a.starts_at);
            return t >= dayStart && t < dayEnd;
          });
          const dayBlocks = blocks.filter((b) => new Date(b.starts_at) < dayEnd && new Date(b.ends_at) > dayStart);

          return (
            <div key={dayKey} className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
              <p className="mb-3 font-bold text-[#C99A2E]">{dayFormatter.format(day)}</p>

              {dayBlocks.map((b) => (
                <p key={b.id} className="mb-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-400">
                  🚫 {b.label || "Blocked"} — {b.all_day ? "All day" : `${timeFormatter.format(new Date(b.starts_at))}–${timeFormatter.format(new Date(b.ends_at))}`}
                </p>
              ))}

              {dayAppointments.length === 0 && dayBlocks.length === 0 ? (
                <p className="text-sm text-gray-600">Nothing scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((a) => (
                    <Link
                      key={a.id}
                      href={`/admin/appointments/${a.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-[#C99A2E]/40"
                    >
                      <span>
                        {timeFormatter.format(new Date(a.starts_at))} — {a.clients?.full_name} ({a.services?.name})
                      </span>
                      <span className="text-xs uppercase text-gray-500">{a.status.replace("_", " ")}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
