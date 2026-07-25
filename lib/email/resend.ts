import { Resend } from "resend";

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn("RESEND_API_KEY or RESEND_FROM_EMAIL not set — skipping email send:", params.subject);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("Failed to send email:", error);
  }
}
