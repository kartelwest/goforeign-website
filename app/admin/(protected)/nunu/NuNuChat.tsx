"use client";

import { useRef, useState } from "react";
import {
  applySchedule,
  confirmAction,
  getRecentMessages,
  rejectAction,
  sendMessage,
  uploadSchedule,
  type ChatMessage,
} from "./actions";

type ReviewShift = { date: string; start_time: string; end_time: string; label: string };

export default function NuNuChat({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [review, setReview] = useState<{
    uploadId: string;
    shifts: ReviewShift[];
    confidence: number;
    unclear: string[];
  } | null>(null);
  const [applying, setApplying] = useState(false);
  const [conflicts, setConflicts] = useState<{ date: string; label: string }[] | null>(null);

  async function refresh() {
    setMessages(await getRecentMessages());
  }

  async function handleSend() {
    if (!input.trim()) return;
    setSending(true);
    setError(null);
    const text = input;
    setInput("");
    const result = await sendMessage(text);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function handleConfirm(id: string) {
    setError(null);
    const result = await confirmAction(id);
    if (!result.ok) setError(result.error);
    await refresh();
  }

  async function handleReject(id: string) {
    await rejectAction(id);
    await refresh();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setConflicts(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadSchedule(formData);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReview({
      uploadId: result.uploadId,
      shifts: result.shifts,
      confidence: result.confidence,
      unclear: result.unclear,
    });
  }

  function updateShift(index: number, patch: Partial<ReviewShift>) {
    if (!review) return;
    setReview({
      ...review,
      shifts: review.shifts.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  function deleteShift(index: number) {
    if (!review) return;
    setReview({ ...review, shifts: review.shifts.filter((_, i) => i !== index) });
  }

  async function handleApply() {
    if (!review) return;
    setApplying(true);
    setError(null);
    setConflicts(null);
    const result = await applySchedule({ uploadId: review.uploadId, shifts: review.shifts });
    setApplying(false);

    if (result.ok) {
      setReview(null);
      await refresh();
      return;
    }
    if ("conflicts" in result) {
      setConflicts(result.conflicts);
      return;
    }
    setError(result.error);
  }

  return (
    <div>
      <div className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-zinc-950 p-5">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-600">
            Try: &ldquo;Block next Tuesday all day&rdquo;, &ldquo;What&apos;s on my calendar Thursday?&rdquo;, or upload a schedule photo below.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
              <div
                className={`inline-block max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                  m.role === "user" ? "bg-[#B8860B] text-black" : "bg-black/60 text-gray-200"
                }`}
              >
                {m.content}
              </div>
              {m.action_status === "proposed" && (
                <div className="mt-2 flex justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirm(m.id)}
                    className="rounded-full bg-[#C99A2E] px-4 py-1 text-xs font-bold text-black hover:bg-[#F2C14E]"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(m.id)}
                    className="rounded-full border border-white/20 px-4 py-1 text-xs font-bold hover:border-red-400 hover:text-red-400"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {m.action_status === "confirmed" && (
                <p className="mt-1 text-xs text-green-400">✓ Done</p>
              )}
              {m.action_status === "rejected" && (
                <p className="mt-1 text-xs text-gray-500">Dismissed</p>
              )}
            </div>
          ))
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
      )}

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Nu Nu or give a command…"
          className="flex-1 rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="rounded-full bg-[#B8860B] px-6 py-3 font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>

      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#C99A2E] px-5 py-2 text-sm font-bold text-[#C99A2E] hover:bg-[#C99A2E] hover:text-black">
          {uploading ? "Reading image…" : "📷 Upload schedule photo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {review && (
        <div className="mt-6 rounded-2xl border border-[#C99A2E]/30 bg-zinc-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-[#C99A2E]">Review extracted shifts</h2>
            <span className="text-xs text-gray-500">Confidence: {Math.round(review.confidence * 100)}%</span>
          </div>

          {review.unclear.length > 0 && (
            <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-300">
              {review.unclear.map((u, i) => (
                <p key={i}>⚠️ {u}</p>
              ))}
            </div>
          )}

          {conflicts && conflicts.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              <p className="mb-1 font-bold">These collide with booked appointments — nothing was applied:</p>
              {conflicts.map((c, i) => (
                <p key={i}>{c.date} — {c.label}</p>
              ))}
              <p className="mt-1">Remove or adjust those rows, then apply again.</p>
            </div>
          )}

          <div className="space-y-2">
            {review.shifts.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_2fr_auto] gap-2">
                <input
                  type="date"
                  value={s.date}
                  onChange={(e) => updateShift(i, { date: e.target.value })}
                  className="rounded-lg border border-white/20 bg-black px-2 py-2 text-xs text-white focus:border-[#C99A2E] focus:outline-none"
                />
                <input
                  type="time"
                  value={s.start_time}
                  onChange={(e) => updateShift(i, { start_time: e.target.value })}
                  className="rounded-lg border border-white/20 bg-black px-2 py-2 text-xs text-white focus:border-[#C99A2E] focus:outline-none"
                />
                <input
                  type="time"
                  value={s.end_time}
                  onChange={(e) => updateShift(i, { end_time: e.target.value })}
                  className="rounded-lg border border-white/20 bg-black px-2 py-2 text-xs text-white focus:border-[#C99A2E] focus:outline-none"
                />
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => updateShift(i, { label: e.target.value })}
                  className="rounded-lg border border-white/20 bg-black px-2 py-2 text-xs text-white focus:border-[#C99A2E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => deleteShift(i)}
                  className="text-xs font-bold text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {review.shifts.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No shifts left to apply.</p>
          ) : (
            <p className="mt-4 text-xs text-gray-500">
              This will block {review.shifts.length} time slot(s) and cancel 0 existing appointments — anything
              that collides with a booking will stop the whole apply instead.
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setReview(null)}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-bold hover:border-[#C99A2E]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || review.shifts.length === 0}
              className="flex-1 rounded-full bg-[#B8860B] px-6 py-2 text-sm font-bold text-black hover:bg-[#D4A017] disabled:opacity-50"
            >
              {applying ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
