import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppointmentDetail } from "@/lib/admin/data";
import AppointmentDetailView from "./AppointmentDetailView";

export const metadata: Metadata = { title: "Appointment" };
export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { appointment, notes, payments } = await getAppointmentDetail(id);

  if (!appointment) notFound();

  return <AppointmentDetailView appointment={appointment} notes={notes} payments={payments} />;
}
