"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "./actions";
import CalendarSlotPicker from "../CalendarSlotPicker";

type Service = {
  id: string;
  slug: string;
  name: string;
  durationMinutes: number;
};

type Step = "pick" | "intake" | "review" | "submitting";

export default function BookingFlow({
  service,
  paymentMessage,
}: {
  service: Service;
  businessTimezone: string;
  paymentMessage: string;
}) {
  const router = useRouter();
  const clientTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const [step, setStep] = useState<Step>("pick");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setStep("submitting");
    setError(null);

    const result = await bookAppointment({
      serviceId: service.id,
      startsAtIso: selectedSlot,
      fullName,
      email,
      phone,
      timezone: clientTimezone,
      intakeNotes: notes,
    });

    if (!result.ok) {
      setError(result.error);
      setStep("review");
      return;
    }

    router.push(`/book/confirmation/${result.manageToken}`);
  }

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

  if (step === "pick") {
    return (
      <div className="rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 p-6 md:p-10">
        <CalendarSlotPicker
          serviceSlug={service.slug}
          clientTimezone={clientTimezone}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
        />

        {selectedSlot && (
          <button
            type="button"
            onClick={() => setStep("intake")}
            className="mt-6 w-full rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017]"
          >
            Continue →
          </button>
        )}
      </div>
    );
  }

  if (step === "intake") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep("review");
        }}
        className="rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 p-6 md:p-10"
      >
        <h2 className="mb-6 text-xl font-bold text-[#C99A2E]">Your details</h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="email">Email</label>
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
            <label className="mb-2 block text-sm font-semibold" htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="notes">
              What would you like to cover?
            </label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="rounded-full border border-white/20 px-6 py-3 font-bold hover:border-[#C99A2E]"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="flex-1 rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017]"
          >
            Review Booking →
          </button>
        </div>
      </form>
    );
  }

  // review + submitting
  return (
    <div className="rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 p-6 md:p-10">
      <h2 className="mb-6 text-xl font-bold text-[#C99A2E]">Review your booking</h2>

      <dl className="space-y-3 text-gray-300">
        <div className="flex justify-between border-b border-white/10 pb-3">
          <dt className="text-gray-500">Service</dt>
          <dd className="font-semibold text-white">{service.name} ({service.durationMinutes} min)</dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-3">
          <dt className="text-gray-500">When</dt>
          <dd className="text-right font-semibold text-white">
            {selectedSlot && dateFormatter.format(new Date(selectedSlot))}
            <br />
            {selectedSlot && timeFormatter.format(new Date(selectedSlot))} ({clientTimezone})
          </dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-3">
          <dt className="text-gray-500">Name</dt>
          <dd className="font-semibold text-white">{fullName}</dd>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-3">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-semibold text-white">{email}</dd>
        </div>
        {phone && (
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-semibold text-white">{phone}</dd>
          </div>
        )}
        {notes && (
          <div className="border-b border-white/10 pb-3">
            <dt className="mb-1 text-gray-500">What to cover</dt>
            <dd className="text-white">{notes}</dd>
          </div>
        )}
      </dl>

      <p className="mt-6 rounded-xl border border-[#C99A2E]/20 bg-black/40 p-4 text-sm text-gray-300">
        {paymentMessage}
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={() => setStep("intake")}
          disabled={step === "submitting"}
          className="rounded-full border border-white/20 px-6 py-3 font-bold hover:border-[#C99A2E] disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={step === "submitting"}
          className="flex-1 rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017] disabled:opacity-50"
        >
          {step === "submitting" ? "Booking…" : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}
