function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function buildAppointmentIcs(params: {
  uid: string;
  serviceName: string;
  startsAt: Date;
  durationMinutes: number;
  confirmationCode: string;
}): string {
  const { uid, serviceName, startsAt, durationMinutes, confirmationCode } = params;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Go Foreign//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@goforeign.com`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(startsAt)}`,
    `DTEND:${toIcsUtc(endsAt)}`,
    `SUMMARY:${escapeIcsText(`Go Foreign — ${serviceName}`)}`,
    `DESCRIPTION:${escapeIcsText(`Confirmation code: ${confirmationCode}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
