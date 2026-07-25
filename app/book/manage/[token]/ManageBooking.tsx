"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarSlotPicker from "../../CalendarSlotPicker";
import { cancelAppointment, rescheduleAppointment } from "./actions";
import type { AppointmentByToken } from "@/lib/booking/token";

type Mode = "view" | "cancel" | "reschedule";

export default function ManageBooking({
  token,
  appointment: initialAppointment,
  cancelCutoffHours,
}: {
  token: string;
  appointment: AppointmentByToken;
  cancelCutoffHours: number;
}) {
  const clientTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [appointment, setAppointment] = useState(initialAppointment);
  const [mode, setMode] = useState<Mode>("view");
  const [reason, setReason] = useState("");
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startsAt = new Date(appointment.starts_at);

  // Reads the system clock, which only an effect may do — render must stay
  // pure. Re-checks every minute so the gate doesn't go stale on a long-open
  // tab. The server-side RPC re-checks the cutoff regardless, so this is
  // purely a UX gate, not the security boundary.
  const [pastCutoff, setPastCutoff] = useState(false);
  useEffect(() => {
    const cutoffMs = cancelCutoffHours * 60 * 60 * 1000;
    const check = () => {
      setPastCutoff(new Date(appointment.starts_at).getTime() - Date.now() < cutoffMs);
    };
    const timeoutId = setTimeout(check, 0);
    const intervalId = setInterval(check, 60_000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [appointment.starts_at, cancelCutoffHours]);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: clientTimezone,
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: clientTimezone,
  });

  const isFinal = ["cancelled", "completed", "no_show"].includes(appointment.status);

  async function handleCancel() {
    setBusy(true);
    setError(null);
    const result = await cancelAppointment(token, reason);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAppointment({ ...appointment, status: "cancelled" });
    setMode("view");
  }

  async function handleReschedule() {
    if (!newSlot) return;
    setBusy(true);
    setError(null);
    const result = await rescheduleAppointment(token, newSlot);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAppointment({ ...appointment, starts_at: newSlot });
    setMode("view");
    setNewSlot(null);
  }

  return (
    <div className="rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 p-6 md:p-10">
      <p className="mb-1 text-sm text-gray-500">
        Confirmation code: <span className="font-mono text-gray-300">{appointment.confirmation_code}</span>
      </p>
      <p className="mb-1 text-2xl font-bold text-[#C99A2E]">{dateFormatter.format(startsAt)}</p>
      <p className="mb-6 text-lg text-gray-300">
        {timeFormatter.format(startsAt)} ({clientTimezone})
      </p>
      <p className="mb-6 inline-block rounded-full border border-white/20 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-gray-300">
        Status: {appointment.status.replace("_", " ")}
      </p>

      {error && (
        <p className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
      )}

      {isFinal && (
        <p className="text-gray-400">This booking is {appointment.status.replace("_", " ")} and can no longer be changed here.</p>
      )}

      {!isFinal && pastCutoff && mode === "view" && (
        <p className="text-gray-400">
          It&apos;s within {cancelCutoffHours} hours of your appointment, so online changes are closed. Please
          contact us directly if you need to change this booking.
        </p>
      )}

      {!isFinal && !pastCutoff && mode === "view" && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="flex-1 rounded-full border border-[#C99A2E] px-6 py-3 font-bold text-[#C99A2E] transition hover:bg-[#C99A2E] hover:text-black"
          >
            Reschedule
          </button>
          <button
            type="button"
            onClick={() => setMode("cancel")}
            className="flex-1 rounded-full border border-red-500/60 px-6 py-3 font-bold text-red-400 transition hover:bg-red-500/10"
          >
            Cancel Booking
          </button>
        </div>
      )}

      {mode === "cancel" && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <label className="mb-2 block text-sm font-semibold" htmlFor="reason">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
          />
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setMode("view")}
              disabled={busy}
              className="rounded-full border border-white/20 px-6 py-3 font-bold hover:border-[#C99A2E] disabled:opacity-50"
            >
              Never mind
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="flex-1 rounded-full bg-red-500/90 px-6 py-3 font-bold text-black transition hover:bg-red-400 disabled:opacity-50"
            >
              {busy ? "Cancelling…" : "Confirm Cancellation"}
            </button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <CalendarSlotPicker
            serviceSlug={appointment.service_slug}
            clientTimezone={clientTimezone}
            selectedSlot={newSlot}
            onSelectSlot={setNewSlot}
          />
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setNewSlot(null);
              }}
              disabled={busy}
              className="rounded-full border border-white/20 px-6 py-3 font-bold hover:border-[#C99A2E] disabled:opacity-50"
            >
              Never mind
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              disabled={busy || !newSlot}
              className="flex-1 rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017] disabled:opacity-50"
            >
              {busy ? "Rescheduling…" : "Confirm New Time"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
