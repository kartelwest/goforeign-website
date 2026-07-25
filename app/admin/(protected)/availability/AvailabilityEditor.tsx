"use client";

import { useState } from "react";
import type { BookingSettings } from "@/lib/supabase/types";
import { createBlock, deleteBlock, saveBookingSettings, saveWeeklyHours } from "./actions";

type DayRule = { dayOfWeek: number; isActive: boolean; startTime: string; endTime: string };
type Block = { id: string; startsAt: string; endsAt: string; allDay: boolean; label: string | null };

export default function AvailabilityEditor({
  initialWeeklyHours,
  initialBookingSettings,
  initialBlocks,
  dayNames,
}: {
  initialWeeklyHours: DayRule[];
  initialBookingSettings: BookingSettings;
  initialBlocks: Block[];
  dayNames: string[];
}) {
  const [weeklyHours, setWeeklyHours] = useState(initialWeeklyHours);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);

  const [settings, setSettings] = useState(initialBookingSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [blocks, setBlocks] = useState(initialBlocks);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockLabel, setBlockLabel] = useState("");
  const [blockWarning, setBlockWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateDay(dayOfWeek: number, patch: Partial<DayRule>) {
    setWeeklyHours((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  }

  async function handleSaveHours() {
    setSavingHours(true);
    setError(null);
    const result = await saveWeeklyHours(weeklyHours);
    setSavingHours(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 2000);
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    setError(null);
    const result = await saveBookingSettings({
      leadTimeHours: settings.lead_time_hours,
      bookingWindowDays: settings.booking_window_days,
      slotGranularityMin: settings.slot_granularity_min,
      maxPerDay: settings.max_per_day,
      cancelCutoffHours: settings.cancel_cutoff_hours,
    });
    setSavingSettings(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  async function handleCreateBlock(force: boolean) {
    if (!blockStart || !blockEnd) {
      setError("Pick a start and end.");
      return;
    }
    setError(null);
    setBlockWarning(null);

    const result = await createBlock({
      startsAtIso: new Date(blockStart).toISOString(),
      endsAtIso: new Date(blockEnd).toISOString(),
      allDay: false,
      label: blockLabel,
      force,
    });

    if (result.ok) {
      setBlocks((prev) => [
        ...prev,
        { id: crypto.randomUUID(), startsAt: new Date(blockStart).toISOString(), endsAt: new Date(blockEnd).toISOString(), allDay: false, label: blockLabel || null },
      ].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setBlockStart("");
      setBlockEnd("");
      setBlockLabel("");
      return;
    }

    if ("needsConfirmation" in result && result.needsConfirmation) {
      setBlockWarning(result.warning);
      return;
    }

    setError(result.error);
  }

  async function handleDeleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    await deleteBlock(id);
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="mb-4 text-xl font-bold text-[#C99A2E]">Weekly Recurring Hours</h2>
        <div className="space-y-3">
          {weeklyHours.map((d) => (
            <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-3">
              <label className="flex w-32 items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={d.isActive}
                  onChange={(e) => updateDay(d.dayOfWeek, { isActive: e.target.checked })}
                />
                {dayNames[d.dayOfWeek]}
              </label>
              <input
                type="time"
                value={d.startTime}
                disabled={!d.isActive}
                onChange={(e) => updateDay(d.dayOfWeek, { startTime: e.target.value })}
                className="rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none disabled:opacity-40"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={d.endTime}
                disabled={!d.isActive}
                onChange={(e) => updateDay(d.dayOfWeek, { endTime: e.target.value })}
                className="rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none disabled:opacity-40"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSaveHours}
          disabled={savingHours}
          className="mt-5 rounded-full bg-[#B8860B] px-6 py-2 text-sm font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
        >
          {savingHours ? "Saving…" : hoursSaved ? "Saved ✓" : "Save Hours"}
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="mb-4 text-xl font-bold text-[#C99A2E]">Booking Rules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Lead time (hours)
            <input
              type="number"
              value={settings.lead_time_hours}
              onChange={(e) => setSettings({ ...settings, lead_time_hours: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </label>
          <label className="text-sm">
            Booking window (days)
            <input
              type="number"
              value={settings.booking_window_days}
              onChange={(e) => setSettings({ ...settings, booking_window_days: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </label>
          <label className="text-sm">
            Slot granularity (min)
            <input
              type="number"
              value={settings.slot_granularity_min}
              onChange={(e) => setSettings({ ...settings, slot_granularity_min: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </label>
          <label className="text-sm">
            Cancel cutoff (hours)
            <input
              type="number"
              value={settings.cancel_cutoff_hours}
              onChange={(e) => setSettings({ ...settings, cancel_cutoff_hours: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Max appointments per day (blank = no limit)
            <input
              type="number"
              value={settings.max_per_day ?? ""}
              onChange={(e) => setSettings({ ...settings, max_per_day: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="mt-5 rounded-full bg-[#B8860B] px-6 py-2 text-sm font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
        >
          {savingSettings ? "Saving…" : settingsSaved ? "Saved ✓" : "Save Rules"}
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="mb-4 text-xl font-bold text-[#C99A2E]">Blackout Dates / Blocks</h2>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <input
            type="datetime-local"
            value={blockStart}
            onChange={(e) => setBlockStart(e.target.value)}
            className="rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
          />
          <input
            type="datetime-local"
            value={blockEnd}
            onChange={(e) => setBlockEnd(e.target.value)}
            className="rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={blockLabel}
            onChange={(e) => setBlockLabel(e.target.value)}
            className="rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
          />
        </div>

        {blockWarning && (
          <div className="mb-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-300">
            <p className="mb-3">⚠️ {blockWarning}</p>
            <button
              type="button"
              onClick={() => handleCreateBlock(true)}
              className="rounded-full bg-yellow-500 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-400"
            >
              Block anyway
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => handleCreateBlock(false)}
          className="mb-6 rounded-full border border-[#C99A2E] px-5 py-2 text-sm font-bold text-[#C99A2E] hover:bg-[#C99A2E] hover:text-black"
        >
          + Add Block
        </button>

        <div className="space-y-2">
          {blocks.length === 0 ? (
            <p className="text-sm text-gray-600">No upcoming blocks.</p>
          ) : (
            blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 text-sm">
                <span>
                  {b.label || "Blocked"} — {new Date(b.startsAt).toLocaleString()} to {new Date(b.endsAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(b.id)}
                  className="font-semibold text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
