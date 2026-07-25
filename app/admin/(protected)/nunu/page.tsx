import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nu Nu" };

export default function NuNuPage() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Coming Soon</p>
      <h1 className="mb-4 text-3xl font-black">Nu Nu</h1>
      <p className="text-gray-400">
        Your assistant for text commands and schedule-photo parsing is being built next.
      </p>
    </div>
  );
}
