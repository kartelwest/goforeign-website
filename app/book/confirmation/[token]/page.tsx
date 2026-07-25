import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppointmentByToken } from "@/lib/booking/token";
import { getPaymentsSettings } from "@/lib/booking/data";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [appointment, payments] = await Promise.all([
    getAppointmentByToken(token),
    getPaymentsSettings(),
  ]);

  if (!appointment) notFound();

  const startsAt = new Date(appointment.starts_at);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: appointment.client_timezone,
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: appointment.client_timezone,
  });

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#C99A2E]/30 bg-zinc-950 p-10 text-center">
        <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Booking Confirmed</p>
        <h1 className="mb-6 text-4xl font-black">You&apos;re all set, {appointment.client_full_name.split(" ")[0]}.</h1>

        <p className="mb-1 text-lg text-gray-300">{appointment.service_name}</p>
        <p className="mb-1 text-2xl font-bold text-[#C99A2E]">{dateFormatter.format(startsAt)}</p>
        <p className="mb-6 text-lg text-gray-300">
          {timeFormatter.format(startsAt)} ({appointment.client_timezone})
        </p>

        <p className="mb-8 text-sm text-gray-500">
          Confirmation code: <span className="font-mono text-gray-300">{appointment.confirmation_code}</span>
        </p>

        <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href={`/api/ics/${token}`}
            className="rounded-full bg-[#B8860B] px-6 py-3 font-bold text-black transition hover:bg-[#D4A017]"
          >
            Add to Calendar
          </a>
          <Link
            href={`/book/manage/${token}`}
            className="rounded-full border border-[#C99A2E] px-6 py-3 font-bold text-[#C99A2E] transition hover:bg-[#C99A2E] hover:text-black"
          >
            Manage Booking
          </Link>
        </div>

        <p className="rounded-xl border border-[#C99A2E]/20 bg-black/40 p-4 text-sm text-gray-300">
          {payments.public_message}
        </p>
      </div>
    </main>
  );
}
