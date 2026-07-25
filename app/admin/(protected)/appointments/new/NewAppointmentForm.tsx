"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createManualAppointment } from "./actions";

type Service = { id: string; name: string; durationMinutes: number };

export default function NewAppointmentForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(force: boolean) {
    if (!date || !time) {
      setError("Pick a date and time.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setWarning(null);

    const startsAtIso = new Date(`${date}T${time}:00`).toISOString();

    const result = await createManualAppointment({
      serviceId,
      startsAtIso,
      fullName,
      email,
      phone,
      notes,
      force,
    });

    setSubmitting(false);

    if (result.ok) {
      router.push(`/admin/appointments/${result.appointmentId}`);
      return;
    }

    if ("needsConfirmation" in result && result.needsConfirmation) {
      setWarning(result.warning);
      return;
    }

    setError(result.error);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="space-y-5 rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8"
    >
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="service">Service</label>
        <select
          id="service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.durationMinutes} min)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-gray-500">Date/time entered in your local browser time.</p>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="fullName">Client name</label>
        <input
          id="fullName"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="email">Client email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="phone">Client phone (optional)</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
      </div>

      {warning && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-300">
          <p className="mb-3">⚠️ {warning}</p>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={submitting}
            className="rounded-full bg-yellow-500 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
          >
            Book anyway
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017] disabled:opacity-50"
      >
        {submitting ? "Booking…" : "Create Appointment"}
      </button>
    </form>
  );
}
