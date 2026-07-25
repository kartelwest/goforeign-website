import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { getSlotsForDay } from "@/lib/booking/availability";
import {
  getAvailabilityBlocks,
  getAvailabilityRules,
  getBookingSettings,
  getBusinessSettings,
  getBusyAppointments,
  getServiceBySlug,
} from "@/lib/booking/data";

const querySchema = z.object({
  serviceSlug: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    serviceSlug: request.nextUrl.searchParams.get("serviceSlug"),
    month: request.nextUrl.searchParams.get("month"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const { serviceSlug, month } = parsed.data;
  const service = await getServiceBySlug(serviceSlug);
  if (!service) {
    return NextResponse.json({ error: "service_not_found" }, { status: 404 });
  }

  const [settings, business, rules] = await Promise.all([
    getBookingSettings(),
    getBusinessSettings(),
    getAvailabilityRules(),
  ]);

  const [year, monthNum] = month.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, monthNum - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();

  const now = new Date();
  // Padded by a day on each side so a business-local day near a UTC month
  // boundary (e.g. America/New_York trailing UTC) still pulls in every
  // block/appointment that could overlap it.
  const rangeStart = addDays(firstOfMonth, -1);
  const rangeEnd = addDays(firstOfMonth, daysInMonth + 1);

  const [blocks, busyAppointments] = await Promise.all([
    getAvailabilityBlocks(rangeStart, rangeEnd),
    getBusyAppointments(rangeStart, rangeEnd),
  ]);

  const days: Record<string, boolean> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    if (settings.max_per_day != null) {
      const dayStart = fromZonedTime(`${dateStr}T00:00:00`, business.timezone);
      const dayEnd = fromZonedTime(`${dateStr}T23:59:59.999`, business.timezone);
      const countOnDay = busyAppointments.filter((a) => {
        const startsAt = new Date(a.starts_at);
        return startsAt >= dayStart && startsAt <= dayEnd;
      }).length;
      if (countOnDay >= settings.max_per_day) {
        days[dateStr] = false;
        continue;
      }
    }

    const slots = getSlotsForDay({
      dateInBusinessTz: dateStr,
      businessTimezone: business.timezone,
      durationMinutes: service.duration_minutes,
      bufferAfterMin: service.buffer_after_min,
      rules,
      blocks,
      busyAppointments,
      settings,
      now,
    });

    days[dateStr] = slots.length > 0;
  }

  return NextResponse.json({ days, todayInBusinessTz: formatInTimeZone(now, business.timezone, "yyyy-MM-dd") });
}
