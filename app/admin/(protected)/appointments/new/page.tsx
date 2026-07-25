import type { Metadata } from "next";
import { getAllServices } from "@/lib/admin/data";
import NewAppointmentForm from "./NewAppointmentForm";

export const metadata: Metadata = { title: "New Appointment" };
export const dynamic = "force-dynamic";

export default async function NewAppointmentPage() {
  const services = await getAllServices();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-3xl font-black">New Appointment</h1>
      <NewAppointmentForm
        services={services.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.duration_minutes }))}
      />
    </div>
  );
}
