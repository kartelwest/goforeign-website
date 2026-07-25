import type { Metadata } from "next";
import Link from "next/link";
import { getPublicServices } from "@/lib/booking/data";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Choose a Go Foreign consultation and pick a time that works for you.",
  alternates: { canonical: "/book" },
};

export const dynamic = "force-dynamic";

export default async function BookServicePage() {
  const services = await getPublicServices();

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Book a Consultation</p>
        <h1 className="mb-10 text-4xl font-black md:text-5xl">Choose your session</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/book/${service.slug}`}
              className="flex flex-col rounded-3xl border border-[#C99A2E]/20 bg-zinc-950 p-8 transition duration-500 hover:-translate-y-1 hover:border-[#C99A2E] hover:shadow-2xl hover:shadow-[#C99A2E]/20"
            >
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#C99A2E]">
                {service.duration_minutes} minutes
              </p>
              <h2 className="mb-3 text-2xl font-bold">{service.name}</h2>
              <p className="flex-1 text-sm leading-relaxed text-gray-400">{service.description}</p>
              <span className="mt-6 font-bold text-[#C99A2E]">Select this session →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
