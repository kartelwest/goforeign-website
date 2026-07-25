import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    serviceSlug: request.nextUrl.searchParams.get("serviceSlug"),
    date: request.nextUrl.searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const { serviceSlug, date } = parsed.data;
  const service = await getServiceBySlug(serviceSlug);
  if (!service) {
    return NextResponse.json({ error: "service_not_found" }, { status: 404 });
  }

  const [settings, business, rules] = await Promise.all([
    getBookingSettings(),
    getBusinessSettings(),
    getAvailabilityRules(),
  ]);

  const dayStart = fromZonedTime(`${date}T00:00:00`, business.timezone);
  const dayEnd = addDays(dayStart, 1);

  const [blocks, busyAppointments] = await Promise.all([
    getAvailabilityBlocks(dayStart, dayEnd),
    getBusyAppointments(dayStart, dayEnd),
  ]);

  if (settings.max_per_day != null && busyAppointments.length >= settings.max_per_day) {
    return NextResponse.json({ slots: [] });
  }

  const slots = getSlotsForDay({
    dateInBusinessTz: date,
    businessTimezone: business.timezone,
    durationMinutes: service.duration_minutes,
    bufferAfterMin: service.buffer_after_min,
    rules,
    blocks,
    busyAppointments,
    settings,
    now: new Date(),
  });

  return NextResponse.json({ slots });
}
