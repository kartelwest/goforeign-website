"use client";

import { useState } from "react";
import type { getAppointmentDetail } from "@/lib/admin/data";
import type { AppointmentStatus, PaymentMethod, PaymentStatus } from "@/lib/supabase/types";
import { addAppointmentNote, recordPayment, setPaymentStatus, updateAppointmentStatus } from "./actions";

type Detail = Awaited<ReturnType<typeof getAppointmentDetail>>;

const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "deposit_paid", "paid", "refunded", "waived"];
const PAYMENT_METHODS: PaymentMethod[] = ["zelle", "cashapp", "card", "ach", "cash", "check", "other"];

export default function AppointmentDetailView({
  appointment,
  notes,
  payments,
}: {
  appointment: NonNullable<Detail["appointment"]>;
  notes: Detail["notes"];
  payments: Detail["payments"];
}) {
  const [status, setStatus] = useState(appointment.status);
  const [paymentStatus, setPaymentStatusState] = useState(appointment.payment_status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("zelle");
  const [reference, setReference] = useState("");

  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState<"session" | "followup" | "internal">("session");
  const [savingNote, setSavingNote] = useState(false);

  const client = appointment.clients;
  const service = appointment.services;

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  async function handleStatusChange(next: AppointmentStatus) {
    setSavingStatus(true);
    setError(null);
    const result = await updateAppointmentStatus(appointment.id, next);
    setSavingStatus(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(next);
  }

  async function handlePaymentStatusChange(next: PaymentStatus) {
    setSavingPayment(true);
    setError(null);
    const result = await setPaymentStatus(appointment.id, next);
    setSavingPayment(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPaymentStatusState(next);
  }

  async function handleRecordPayment() {
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (!amountCents || amountCents <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    setSavingPayment(true);
    setError(null);
    const result = await recordPayment({
      appointmentId: appointment.id,
      clientId: client!.id,
      amountCents,
      method,
      reference,
    });
    setSavingPayment(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPaymentStatusState("paid");
    setShowPaymentForm(false);
    setAmount("");
    setReference("");
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    setSavingNote(true);
    const result = await addAppointmentNote({ appointmentId: appointment.id, body: noteBody, noteType });
    setSavingNote(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNoteBody("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-gray-500">
          Confirmation code: <span className="font-mono text-gray-300">{appointment.confirmation_code}</span>
        </p>
        <h1 className="mt-1 text-3xl font-black">{service?.name}</h1>
        <p className="mt-1 text-lg text-gray-400">{dateFormatter.format(new Date(appointment.starts_at))}</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#C99A2E]">Status</p>
          <select
            value={status}
            disabled={savingStatus}
            onChange={(e) => handleStatusChange(e.target.value as AppointmentStatus)}
            className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#C99A2E]">Payment</p>
          <select
            value={paymentStatus}
            disabled={savingPayment}
            onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
            className="mb-3 w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="text-sm font-semibold text-[#C99A2E] hover:underline"
          >
            {showPaymentForm ? "Cancel" : "Record a payment →"}
          </button>

          {showPaymentForm && (
            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <input
                type="number"
                step="0.01"
                placeholder="Amount (USD)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
              />
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Reference (optional)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={savingPayment}
                className="w-full rounded-full bg-[#B8860B] px-4 py-2 text-sm font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
              >
                {savingPayment ? "Saving…" : "Save Payment"}
              </button>
            </div>
          )}

          {payments.length > 0 && (
            <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-xs text-gray-400">
              {payments.map((p) => (
                <p key={p.id}>
                  ${(p.amount_cents / 100).toFixed(2)} via {p.method} —{" "}
                  {new Date(p.received_at).toLocaleDateString()}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#C99A2E]">Client</p>
        <p className="text-lg font-semibold">{client?.full_name}</p>
        <p className="text-sm text-gray-400">{client?.email}</p>
        {client?.phone && <p className="text-sm text-gray-400">{client.phone}</p>}
        {appointment.intake_notes && (
          <p className="mt-3 rounded-lg bg-black/40 p-3 text-sm text-gray-300">
            &ldquo;{appointment.intake_notes}&rdquo;
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#C99A2E]">Notes</p>

        <div className="mb-5 space-y-3">
          <textarea
            rows={3}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Log what you discussed, follow-ups, etc."
            className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as typeof noteType)}
              className="rounded-lg border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-[#C99A2E] focus:outline-none"
            >
              <option value="session">Session</option>
              <option value="followup">Follow-up</option>
              <option value="internal">Internal</option>
            </select>
            <button
              type="button"
              onClick={handleAddNote}
              disabled={savingNote || !noteBody.trim()}
              className="rounded-full bg-[#B8860B] px-5 py-2 text-sm font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
            >
              {savingNote ? "Saving…" : "Add Note"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-600">No notes yet.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-white/10 p-3 text-sm">
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                  {n.note_type} — {new Date(n.created_at).toLocaleString()}
                </p>
                <p className="text-gray-200">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
