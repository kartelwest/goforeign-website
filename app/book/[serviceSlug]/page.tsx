import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBusinessSettings, getPaymentsSettings, getServiceBySlug } from "@/lib/booking/data";
import BookingFlow from "./BookingFlow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serviceSlug: string }>;
}): Promise<Metadata> {
  const { serviceSlug } = await params;
  const service = await getServiceBySlug(serviceSlug);
  return {
    title: service ? `Book: ${service.name}` : "Book a Consultation",
    alternates: { canonical: `/book/${serviceSlug}` },
  };
}

export default async function BookServiceSlugPage({
  params,
}: {
  params: Promise<{ serviceSlug: string }>;
}) {
  const { serviceSlug } = await params;
  const service = await getServiceBySlug(serviceSlug);
  if (!service) notFound();

  const [business, payments] = await Promise.all([getBusinessSettings(), getPaymentsSettings()]);

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">
          {service.duration_minutes}-Minute Session
        </p>
        <h1 className="mb-3 text-4xl font-black md:text-5xl">{service.name}</h1>
        <p className="mb-10 max-w-2xl text-gray-400">{service.description}</p>

        <BookingFlow
          service={{
            id: service.id,
            slug: service.slug,
            name: service.name,
            durationMinutes: service.duration_minutes,
          }}
          businessTimezone={business.timezone}
          paymentMessage={payments.public_message}
        />
      </div>
    </main>
  );
}
