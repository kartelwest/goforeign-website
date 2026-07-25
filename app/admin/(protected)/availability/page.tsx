import type { Metadata } from "next";
import { getAllAvailabilityRules, getUpcomingBlocks } from "@/lib/admin/data";
import { getBookingSettings } from "@/lib/booking/data";
import AvailabilityEditor from "./AvailabilityEditor";

export const metadata: Metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AvailabilityPage() {
  const [rules, blocks, bookingSettings] = await Promise.all([
    getAllAvailabilityRules(),
    getUpcomingBlocks(),
    getBookingSettings(),
  ]);

  const weeklyHours = DAY_NAMES.map((_, dayOfWeek) => {
    const rule = rules.find((r) => r.day_of_week === dayOfWeek);
    return {
      dayOfWeek,
      isActive: Boolean(rule),
      startTime: rule?.start_time.slice(0, 5) ?? "09:00",
      endTime: rule?.end_time.slice(0, 5) ?? "18:00",
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-black">Availability</h1>
      <AvailabilityEditor
        initialWeeklyHours={weeklyHours}
        initialBookingSettings={bookingSettings}
        initialBlocks={blocks.map((b) => ({
          id: b.id,
          startsAt: b.starts_at,
          endsAt: b.ends_at,
          allDay: b.all_day,
          label: b.label,
        }))}
        dayNames={DAY_NAMES}
      />
    </div>
  );
}
