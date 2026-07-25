"use client";

import { useState } from "react";
import type { Database, PaymentsSettings } from "@/lib/supabase/types";
import { savePaymentsSettings, saveService } from "./actions";

type Service = Database["public"]["Tables"]["services"]["Row"];

function ServiceRow({ service, onSaved }: { service: Service; onSaved: (s: Service) => void }) {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? "");
  const [priceCents, setPriceCents] = useState(service.price_cents != null ? String(service.price_cents / 100) : "");
  const [isActive, setIsActive] = useState(service.is_active);
  const [isPublic, setIsPublic] = useState(service.is_public);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveService({
      id: service.id,
      slug: service.slug,
      name,
      description,
      durationMinutes: service.duration_minutes,
      priceCents: priceCents.trim() ? Math.round(parseFloat(priceCents) * 100) : null,
      bufferAfterMin: service.buffer_after_min,
      isActive,
      isPublic,
      sortOrder: service.sort_order,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved({ ...service, name, description, price_cents: priceCents.trim() ? Math.round(parseFloat(priceCents) * 100) : null, is_active: isActive, is_public: isPublic });
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#C99A2E]">
          {service.slug} · {service.duration_minutes} min
        </p>
        <div className="flex gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Public
          </label>
        </div>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-2 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
        placeholder="Name"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="mb-2 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
        placeholder="Description"
      />
      <div className="flex items-center gap-3">
        <input
          value={priceCents}
          onChange={(e) => setPriceCents(e.target.value)}
          placeholder="Price (USD, blank = discussed later)"
          className="flex-1 rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[#B8860B] px-4 py-2 text-xs font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function SettingsEditor({
  initialServices,
  initialPaymentsSettings,
}: {
  initialServices: Service[];
  initialPaymentsSettings: PaymentsSettings;
}) {
  const [services, setServices] = useState(initialServices);
  const [payments, setPayments] = useState(initialPaymentsSettings);
  const [savingPayments, setSavingPayments] = useState(false);
  const [paymentsSaved, setPaymentsSaved] = useState(false);

  async function handleSavePayments() {
    setSavingPayments(true);
    await savePaymentsSettings({ publicMessage: payments.public_message, collectAtBooking: payments.collect_at_booking });
    setSavingPayments(false);
    setPaymentsSaved(true);
    setTimeout(() => setPaymentsSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="mb-4 text-xl font-bold text-[#C99A2E]">Services</h2>
        <div className="space-y-4">
          {services.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onSaved={(updated) => setServices((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
            />
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          New services (duration tiers, slugs) need a quick DB insert for now — ask and I&apos;ll add one.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="mb-4 text-xl font-bold text-[#C99A2E]">Payment Message</h2>
        <textarea
          value={payments.public_message}
          onChange={(e) => setPayments({ ...payments, public_message: e.target.value })}
          rows={3}
          className="mb-3 w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={payments.collect_at_booking}
            onChange={(e) => setPayments({ ...payments, collect_at_booking: e.target.checked })}
          />
          Collect payment at booking (not yet wired up — see PAYMENTS.md)
        </label>
        <button
          type="button"
          onClick={handleSavePayments}
          disabled={savingPayments}
          className="rounded-full bg-[#B8860B] px-6 py-2 text-sm font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
        >
          {savingPayments ? "Saving…" : paymentsSaved ? "Saved ✓" : "Save"}
        </button>
      </section>
    </div>
  );
}
