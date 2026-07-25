import nodemailer from "nodemailer";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variable");
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  return cachedTransporter;
}

/**
 * Sends a notification email for a new enquiry. Failures are the caller's
 * responsibility to catch — the enquiry is already saved to the database
 * regardless of whether this succeeds, so callers should treat email
 * delivery as best-effort and never fail the user-facing request on it.
 */
export async function sendEnquiryEmail({
  subject,
  html,
}: {
  subject: string;
  html: string;
}) {
  const user = process.env.GMAIL_USER;
  const notifyTo = process.env.NOTIFY_EMAIL || user;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Rana Forwarder Website" <${user}>`,
    to: notifyTo,
    subject,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEnquiryEmailHtml(title: string, fields: Record<string, string | undefined>) {
  const rows = Object.entries(fields)
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 12px;color:#1f2937;font-size:14px;">${escapeHtml(String(value))}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#0b3c91;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h2 style="margin:0;font-size:18px;">${escapeHtml(title)}</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:0 0 12px 12px;">
        ${rows}
      </table>
    </div>
  `;
}
