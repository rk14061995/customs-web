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

/**
 * Sends the customer their own copy of a submitted enquiry/quote. Kept
 * separate from sendEnquiryEmail (which notifies the business inbox) since
 * the recipient and tone differ — failures here are also best-effort and
 * must never fail the user-facing request.
 */
export async function sendCustomerConfirmationEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const user = process.env.GMAIL_USER;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Rana Forwarder" <${user}>`,
    to,
    subject,
    html,
  });
}

export function renderQuoteConfirmationEmailHtml(
  name: string,
  fields: Record<string, string | undefined>
) {
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
        <h2 style="margin:0;font-size:18px;">Quote Request Received</h2>
      </div>
      <div style="background:#f8fafc;padding:20px 24px 4px;">
        <p style="margin:0;color:#1f2937;font-size:14px;">
          Hi ${escapeHtml(name.split(" ")[0] || name)}, thanks for reaching out to Rana Forwarder.
          We've received your quote request and our team will get back to you within 24 hours.
        </p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:0 0 12px 12px;">
        ${rows}
      </table>
    </div>
  `;
}

export function renderPaymentLinkEmailHtml(
  name: string,
  {
    invoiceNumber,
    amount,
    currency,
    link,
  }: { invoiceNumber: string; amount: number; currency: string; link: string }
) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#0b3c91;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h2 style="margin:0;font-size:18px;">Payment Request — ${escapeHtml(invoiceNumber)}</h2>
      </div>
      <div style="background:#f8fafc;padding:20px 24px;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 16px;color:#1f2937;font-size:14px;">
          Hi ${escapeHtml(name.split(" ")[0] || name)}, please use the link below to pay
          <strong>${escapeHtml(currency)} ${amount.toLocaleString()}</strong> for invoice
          ${escapeHtml(invoiceNumber)}.
        </p>
        <a href="${link}" style="display:inline-block;background:#0b3c91;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
          Pay Now
        </a>
      </div>
    </div>
  `;
}

/** A free-form message typed by an admin (e.g. replying to a quote request or contact enquiry). */
export function renderAdminMessageEmailHtml(name: string, message: string) {
  const greetName = name.split(" ")[0] || name;
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#0b3c91;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h2 style="margin:0;font-size:18px;">Rana Forwarder</h2>
      </div>
      <div style="background:#f8fafc;padding:20px 24px;border-radius:0 0 12px 12px;">
        ${greetName ? `<p style="margin:0 0 12px;color:#1f2937;font-size:14px;">Hi ${escapeHtml(greetName)},</p>` : ""}
        <p style="margin:0;color:#1f2937;font-size:14px;white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

/** The full itemized breakdown of a quotation, sent directly to the customer. */
export function renderQuotationEmailHtml({
  quoteNumber,
  customerName,
  origin,
  destination,
  serviceType,
  weightKg,
  currency,
  charges,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
}: {
  quoteNumber: string;
  customerName: string;
  origin: string;
  destination: string;
  serviceType: string;
  weightKg: number;
  currency: string;
  charges: { label: string; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
}) {
  const chargeRows = charges
    .map(
      (c) =>
        `<tr><td style="padding:6px 12px;color:#1f2937;font-size:14px;">${escapeHtml(c.label)}</td><td style="padding:6px 12px;text-align:right;color:#1f2937;font-size:14px;">${escapeHtml(currency)} ${c.amount.toLocaleString()}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#0b3c91;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h2 style="margin:0;font-size:18px;">Quotation ${escapeHtml(quoteNumber)}</h2>
      </div>
      <div style="background:#f8fafc;padding:20px 24px;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 16px;color:#1f2937;font-size:14px;">
          Hi ${escapeHtml(customerName.split(" ")[0] || customerName)}, here is your quotation for
          ${escapeHtml(origin)} → ${escapeHtml(destination)} (${escapeHtml(serviceType)}, ${weightKg}kg).
        </p>
        <table style="width:100%;border-collapse:collapse;">${chargeRows}</table>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;border-top:1px solid #e2e8f0;">
          <tr><td style="padding:8px 12px 4px;color:#64748b;font-size:13px;">Subtotal</td><td style="padding:8px 12px 4px;text-align:right;color:#64748b;font-size:13px;">${escapeHtml(currency)} ${subtotal.toLocaleString()}</td></tr>
          <tr><td style="padding:4px 12px;color:#64748b;font-size:13px;">GST / Tax (${taxRate}%)</td><td style="padding:4px 12px;text-align:right;color:#64748b;font-size:13px;">${escapeHtml(currency)} ${taxAmount.toLocaleString()}</td></tr>
          <tr><td style="padding:8px 12px 4px;font-weight:700;color:#0b3c91;font-size:15px;">Total</td><td style="padding:8px 12px 4px;text-align:right;font-weight:700;color:#0b3c91;font-size:15px;">${escapeHtml(currency)} ${total.toLocaleString()}</td></tr>
        </table>
        ${notes ? `<p style="margin-top:16px;color:#1f2937;font-size:13px;"><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ""}
      </div>
    </div>
  `;
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
