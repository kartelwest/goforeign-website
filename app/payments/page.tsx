import type { Metadata } from "next";
import Link from "next/link";
import { getPaymentsSettings } from "@/lib/booking/data";

export const metadata: Metadata = {
  title: "Payments",
  description: "How payment works for your Go Foreign consultation.",
  alternates: { canonical: "/payments" },
};

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await getPaymentsSettings();

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Payments</p>
        <h1 className="mb-8 text-4xl font-black md:text-5xl">How payment works</h1>

        <div className="rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 p-8">
          <p className="text-lg leading-relaxed text-gray-300">{payments.public_message}</p>
        </div>

        <div className="mt-8 space-y-4 text-gray-400">
          <p>
            No payment is required to book a consultation. Once your session is scheduled,
            we&apos;ll confirm rates and accepted payment methods directly with you.
          </p>
        </div>

        <Link
          href="/book"
          className="mt-10 inline-flex rounded-full bg-[#B8860B] px-8 py-4 text-lg font-bold text-black transition hover:bg-[#D4A017]"
        >
          Book a Consultation →
        </Link>
      </div>
    </main>
  );
}
