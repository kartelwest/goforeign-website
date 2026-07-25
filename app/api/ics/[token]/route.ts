import { NextRequest, NextResponse } from "next/server";
import { getAppointmentByToken } from "@/lib/booking/token";
import { buildAppointmentIcs } from "@/lib/booking/ics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const appointment = await getAppointmentByToken(token);
  if (!appointment) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ics = buildAppointmentIcs({
    uid: appointment.id,
    serviceName: appointment.service_name,
    startsAt: new Date(appointment.starts_at),
    durationMinutes: appointment.duration_minutes,
    confirmationCode: appointment.confirmation_code,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="go-foreign-${appointment.confirmation_code}.ics"`,
    },
  });
}
