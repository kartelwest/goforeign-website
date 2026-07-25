"use client";

import { useEffect, useState } from "react";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CalendarSlotPicker({
  serviceSlug,
  clientTimezone,
  selectedSlot,
  onSelectSlot,
}: {
  serviceSlug: string;
  clientTimezone: string;
  selectedSlot: string | null;
  onSelectSlot: (slotIso: string) => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const currentMonthKey = monthKey(viewMonth);

  const [daysData, setDaysData] = useState<{ month: string; days: Record<string, boolean> }>({
    month: "",
    days: {},
  });
  const loadingDays = daysData.month !== currentMonthKey;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<{ date: string; slots: string[] }>({ date: "", slots: [] });
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/availability/days?serviceSlug=${serviceSlug}&month=${currentMonthKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDaysData({ month: currentMonthKey, days: data.days ?? {} });
      });
    return () => {
      cancelled = true;
    };
  }, [currentMonthKey, serviceSlug]);

  function selectDate(key: string) {
    setSelectedDate(key);
    setLoadingSlots(true);
    fetch(`/api/availability/slots?serviceSlug=${serviceSlug}&date=${key}`)
      .then((r) => r.json())
      .then((data) => setSlotsData({ date: key, slots: data.slots ?? [] }))
      .finally(() => setLoadingSlots(false));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      dateKey(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1))
    ),
  ];

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: clientTimezone,
  });
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: clientTimezone,
  });

  const slots = selectedDate && slotsData.date === selectedDate ? slotsData.slots : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold hover:border-[#C99A2E]"
        >
          ← Prev
        </button>
        <h2 className="text-xl font-bold text-[#C99A2E]">
          {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold hover:border-[#C99A2E]"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-gray-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((key, i) => {
          if (!key) return <div key={`empty-${i}`} />;
          const isPast = new Date(`${key}T23:59:59`) < today;
          const isAvailable = !isPast && daysData.days[key];
          const isSelected = key === selectedDate;
          return (
            <button
              key={key}
              type="button"
              disabled={!isAvailable || loadingDays}
              onClick={() => selectDate(key)}
              className={`aspect-square rounded-lg text-sm font-semibold transition ${
                isSelected
                  ? "bg-[#C99A2E] text-black"
                  : isAvailable
                    ? "bg-black text-white hover:bg-[#C99A2E]/20"
                    : "cursor-not-allowed bg-transparent text-gray-700"
              }`}
            >
              {Number(key.slice(-2))}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="mb-4 font-bold text-[#C99A2E]">
            Available times — {dateFormatter.format(new Date(`${selectedDate}T12:00:00`))}
          </h3>
          <p className="mb-4 text-xs text-gray-500">Times shown in your timezone ({clientTimezone}).</p>

          {loadingSlots ? (
            <p className="text-gray-400">Loading times…</p>
          ) : slots.length === 0 ? (
            <p className="text-gray-400">No times left on this day. Try another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                    selectedSlot === slot
                      ? "border-[#C99A2E] bg-[#C99A2E] text-black"
                      : "border-white/20 text-white hover:border-[#C99A2E]"
                  }`}
                >
                  {timeFormatter.format(new Date(slot))}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
