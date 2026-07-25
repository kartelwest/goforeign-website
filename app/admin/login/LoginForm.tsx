"use client";

import { useState } from "react";
import { sendMagicLink } from "./actions";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const result = await sendMagicLink(email);
    if (!result.ok) {
      setError(result.error);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-[#C99A2E]/30 bg-black/40 p-6 text-center">
        <p className="text-lg font-semibold text-[#C99A2E]">Check your email</p>
        <p className="mt-2 text-sm text-gray-400">
          We sent a sign-in link to {email}. It expires shortly, so use it soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-white focus:border-[#C99A2E] focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-[#B8860B] px-6 py-3 font-bold text-black transition hover:bg-[#D4A017] disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
