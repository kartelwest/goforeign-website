import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppointmentByToken } from "@/lib/booking/token";
import { getBookingSettings } from "@/lib/booking/data";
import ManageBooking from "./ManageBooking";

export const metadata: Metadata = {
  title: "Manage Your Booking",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [appointment, settings] = await Promise.all([
    getAppointmentByToken(token),
    getBookingSettings(),
  ]);

  if (!appointment) notFound();

  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 font-bold uppercase tracking-[0.3em] text-[#C99A2E]">Manage Booking</p>
        <h1 className="mb-10 text-4xl font-black">{appointment.service_name}</h1>

        <ManageBooking token={token} appointment={appointment} cancelCutoffHours={settings.cancel_cutoff_hours} />
      </div>
    </main>
  );
}
