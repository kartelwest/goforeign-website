function layout(bodyHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background: #000; color: #fff; padding: 32px;">
      <div style="max-width: 480px; margin: 0 auto; background: #0a0a0a; border: 1px solid #3B2B09; border-radius: 16px; padding: 32px;">
        <p style="color: #C99A2E; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; margin-bottom: 24px;">Go Foreign</p>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function formatDateTime(iso: string, timezone: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: timezone,
    }).format(d),
    time: `${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(d)} (${timezone})`,
  };
}

export function bookingConfirmationEmail(params: {
  clientName: string;
  serviceName: string;
  startsAtIso: string;
  clientTimezone: string;
  confirmationCode: string;
  manageUrl: string;
  paymentMessage: string;
}): { subject: string; html: string } {
  const { date, time } = formatDateTime(params.startsAtIso, params.clientTimezone);
  return {
    subject: `Confirmed: ${params.serviceName} — ${date}`,
    html: layout(`
      <h1 style="font-size: 24px; margin-bottom: 16px;">You're all set, ${params.clientName.split(" ")[0]}.</h1>
      <p style="color: #ccc; margin-bottom: 4px;">${params.serviceName}</p>
      <p style="color: #C99A2E; font-size: 20px; font-weight: bold; margin-bottom: 4px;">${date}</p>
      <p style="color: #ccc; margin-bottom: 24px;">${time}</p>
      <p style="color: #888; font-size: 13px; margin-bottom: 24px;">Confirmation code: ${params.confirmationCode}</p>
      <a href="${params.manageUrl}" style="display:inline-block; background:#B8860B; color:#000; font-weight:bold; padding:12px 24px; border-radius:999px; text-decoration:none; margin-bottom: 24px;">Manage Booking</a>
      <p style="color: #ccc; font-size: 14px; border-top: 1px solid #222; padding-top: 16px;">${params.paymentMessage}</p>
    `),
  };
}

export function bookingNotificationEmail(params: {
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  serviceName: string;
  startsAtIso: string;
  businessTimezone: string;
  intakeNotes: string | null;
}): { subject: string; html: string } {
  const { date, time } = formatDateTime(params.startsAtIso, params.businessTimezone);
  return {
    subject: `New booking: ${params.clientName} — ${date}`,
    html: layout(`
      <h1 style="font-size: 22px; margin-bottom: 16px;">New booking</h1>
      <p style="color: #ccc; margin-bottom: 4px;">${params.serviceName}</p>
      <p style="color: #C99A2E; font-size: 18px; font-weight: bold; margin-bottom: 4px;">${date}</p>
      <p style="color: #ccc; margin-bottom: 24px;">${time}</p>
      <p style="color: #fff; margin-bottom: 4px;"><strong>${params.clientName}</strong></p>
      <p style="color: #ccc; margin-bottom: 4px;">${params.clientEmail}</p>
      ${params.clientPhone ? `<p style="color: #ccc; margin-bottom: 4px;">${params.clientPhone}</p>` : ""}
      ${params.intakeNotes ? `<p style="color: #ccc; margin-top: 16px; border-top: 1px solid #222; padding-top: 16px;">"${params.intakeNotes}"</p>` : ""}
    `),
  };
}

export function cancellationEmail(params: {
  clientName: string;
  serviceName: string;
  startsAtIso: string;
  clientTimezone: string;
}): { subject: string; html: string } {
  const { date, time } = formatDateTime(params.startsAtIso, params.clientTimezone);
  return {
    subject: `Cancelled: ${params.serviceName} — ${date}`,
    html: layout(`
      <h1 style="font-size: 22px; margin-bottom: 16px;">Your booking is cancelled</h1>
      <p style="color: #ccc; margin-bottom: 4px;">${params.serviceName}</p>
      <p style="color: #C99A2E; font-size: 18px; font-weight: bold; margin-bottom: 4px;">${date}</p>
      <p style="color: #ccc;">${time}</p>
    `),
  };
}

export function rescheduleEmail(params: {
  clientName: string;
  serviceName: string;
  newStartsAtIso: string;
  clientTimezone: string;
  manageUrl: string;
}): { subject: string; html: string } {
  const { date, time } = formatDateTime(params.newStartsAtIso, params.clientTimezone);
  return {
    subject: `Rescheduled: ${params.serviceName} — ${date}`,
    html: layout(`
      <h1 style="font-size: 22px; margin-bottom: 16px;">Your booking has a new time</h1>
      <p style="color: #ccc; margin-bottom: 4px;">${params.serviceName}</p>
      <p style="color: #C99A2E; font-size: 18px; font-weight: bold; margin-bottom: 4px;">${date}</p>
      <p style="color: #ccc; margin-bottom: 24px;">${time}</p>
      <a href="${params.manageUrl}" style="display:inline-block; background:#B8860B; color:#000; font-weight:bold; padding:12px 24px; border-radius:999px; text-decoration:none;">Manage Booking</a>
    `),
  };
}
