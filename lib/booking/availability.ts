import { addMinutes, isBefore } from "date-fns";
import { fromZonedTime, format as formatInTz } from "date-fns-tz";
import type { BookingSettings } from "@/lib/supabase/types";

export type AvailabilityRule = {
  day_of_week: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  timezone: string;
  is_active: boolean;
};

export type AvailabilityBlock = {
  starts_at: string; // ISO UTC
  ends_at: string; // ISO UTC
};

export type BusyAppointment = {
  starts_at: string; // ISO UTC
  ends_at: string; // ISO UTC
  buffer_after_min: number;
};

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

// Calendar day-of-week for a "YYYY-MM-DD" string is timezone-independent —
// parse at UTC midday to sidestep the server's local timezone entirely.
function dayOfWeekFor(dateInBusinessTz: string): number {
  return new Date(`${dateInBusinessTz}T12:00:00Z`).getUTCDay();
}

// Candidate slot start times (UTC ISO) for a single calendar day, interpreted
// in the business's timezone, filtered against rules/blocks/existing
// appointments/lead time. Does not enforce the daily cap — callers check
// busyAppointments.length against settings.max_per_day themselves, since the
// cap is a same-day count, not a per-slot property.
export function getSlotsForDay(params: {
  dateInBusinessTz: string; // "YYYY-MM-DD"
  businessTimezone: string;
  durationMinutes: number;
  bufferAfterMin: number;
  rules: AvailabilityRule[];
  blocks: AvailabilityBlock[];
  busyAppointments: BusyAppointment[];
  settings: BookingSettings;
  now: Date;
}): string[] {
  const {
    dateInBusinessTz,
    businessTimezone,
    durationMinutes,
    bufferAfterMin,
    rules,
    blocks,
    busyAppointments,
    settings,
    now,
  } = params;

  const dayOfWeek = dayOfWeekFor(dateInBusinessTz);
  const dayRules = rules.filter((r) => r.is_active && r.day_of_week === dayOfWeek);
  if (dayRules.length === 0) return [];

  const earliestStart = addMinutes(now, settings.lead_time_hours * 60);
  const latestStart = addMinutes(now, settings.booking_window_days * 24 * 60);

  const blockRanges = blocks.map((b) => ({
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  }));
  const busyRanges = busyAppointments.map((a) => ({
    start: new Date(a.starts_at),
    end: addMinutes(new Date(a.ends_at), a.buffer_after_min),
  }));

  const slots: string[] = [];

  for (const rule of dayRules) {
    const windowStart = fromZonedTime(`${dateInBusinessTz}T${rule.start_time}`, businessTimezone);
    const windowEnd = fromZonedTime(`${dateInBusinessTz}T${rule.end_time}`, businessTimezone);

    for (
      let slotStart = windowStart;
      addMinutes(slotStart, durationMinutes).getTime() <= windowEnd.getTime();
      slotStart = addMinutes(slotStart, settings.slot_granularity_min)
    ) {
      const slotEnd = addMinutes(slotStart, durationMinutes);
      const occupiedEnd = addMinutes(slotEnd, bufferAfterMin);

      const withinBounds =
        !isBefore(slotStart, earliestStart) && !isBefore(latestStart, slotStart);

      const blocked =
        blockRanges.some((b) => rangesOverlap(slotStart, occupiedEnd, b.start, b.end)) ||
        busyRanges.some((b) => rangesOverlap(slotStart, occupiedEnd, b.start, b.end));

      if (withinBounds && !blocked) {
        slots.push(slotStart.toISOString());
      }
    }
  }

  return slots.sort();
}

export function formatDateInTz(date: Date, timezone: string): string {
  return formatInTz(date, "yyyy-MM-dd", { timeZone: timezone });
}
