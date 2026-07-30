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
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}) {
  const user = process.env.GMAIL_USER;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Rana Forwarder" <${user}>`,
    to,
    subject,
    html,
    attachments,
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

/** The full itemized breakdown of a quotation, mirroring the admin "view quotation" print page, sent directly to the customer. */
export function renderQuotationEmailHtml({
  quoteNumber,
  createdAt,
  customerName,
  customerCompany,
  customerEmail,
  customerPhone,
  origin,
  destination,
  serviceType,
  weightKg,
  quantity,
  dimensions,
  validUntil,
  currency,
  charges,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
  companyEmail,
  companyPhone,
}: {
  quoteNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  origin: string;
  destination: string;
  serviceType: string;
  weightKg: number;
  quantity: number;
  dimensions?: string;
  validUntil?: string;
  currency: string;
  charges: { label: string; basisLabel: string; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  companyEmail?: string;
  companyPhone?: string;
}) {
  const chargeRows = charges
    .map(
      (c) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#1f2937;font-size:13px;">${escapeHtml(c.label)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;text-align:right;">${escapeHtml(c.basisLabel)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#1f2937;font-size:13px;text-align:right;">${escapeHtml(currency)} ${c.amount.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  const shipmentLine = `${weightKg}kg · ${quantity} box${quantity === 1 ? "" : "es"}${dimensions ? ` · ${escapeHtml(dimensions)}` : ""}`;

  return `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border-bottom:1px solid #e2e8f0;padding-bottom:20px;">
        <tr>
          <td style="vertical-align:top;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#0b3c91;">Rana Forwarder</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Logistics &amp; Freight Forwarding</p>
            ${companyEmail ? `<p style="margin:4px 0 0;font-size:11px;color:#64748b;">${escapeHtml(companyEmail)}</p>` : ""}
            ${companyPhone ? `<p style="margin:0;font-size:11px;color:#64748b;">${escapeHtml(companyPhone)}</p>` : ""}
          </td>
          <td style="vertical-align:top;text-align:right;">
            <p style="margin:0;font-size:15px;font-weight:700;">QUOTATION</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748b;">${escapeHtml(quoteNumber)}</p>
            <p style="margin:0;font-size:12px;color:#64748b;">${new Date(createdAt).toLocaleDateString()}</p>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="width:50%;vertical-align:top;padding-right:12px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Billed To</p>
            <p style="margin:0;font-size:13px;font-weight:600;">${escapeHtml(customerName)}</p>
            ${customerCompany ? `<p style="margin:0;font-size:13px;">${escapeHtml(customerCompany)}</p>` : ""}
            ${customerEmail ? `<p style="margin:0;font-size:13px;">${escapeHtml(customerEmail)}</p>` : ""}
            ${customerPhone ? `<p style="margin:0;font-size:13px;">${escapeHtml(customerPhone)}</p>` : ""}
          </td>
          <td style="width:50%;vertical-align:top;padding-left:12px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;">Shipment Details</p>
            <p style="margin:0;font-size:13px;">${escapeHtml(origin)} → ${escapeHtml(destination)}</p>
            <p style="margin:0;font-size:13px;">${escapeHtml(serviceType)}</p>
            <p style="margin:0;font-size:13px;">${shipmentLine}</p>
            ${validUntil ? `<p style="margin:0;font-size:13px;">Valid until ${escapeHtml(validUntil)}</p>` : ""}
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="padding:0 0 8px;border-bottom:1px solid #cbd5e1;text-align:left;font-size:11px;color:#64748b;">Charge</th>
            <th style="padding:0 0 8px;border-bottom:1px solid #cbd5e1;text-align:right;font-size:11px;color:#64748b;">Basis</th>
            <th style="padding:0 0 8px;border-bottom:1px solid #cbd5e1;text-align:right;font-size:11px;color:#64748b;">Amount</th>
          </tr>
        </thead>
        <tbody>${chargeRows}</tbody>
      </table>

      <table style="width:100%;max-width:260px;margin:0 0 0 auto;border-collapse:collapse;">
        <tr><td style="padding:3px 0;color:#64748b;font-size:13px;">Subtotal</td><td style="padding:3px 0;text-align:right;color:#64748b;font-size:13px;">${escapeHtml(currency)} ${subtotal.toLocaleString()}</td></tr>
        <tr><td style="padding:3px 0;color:#64748b;font-size:13px;">GST / Tax (${taxRate}%)</td><td style="padding:3px 0;text-align:right;color:#64748b;font-size:13px;">${escapeHtml(currency)} ${taxAmount.toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0 0;border-top:1px solid #cbd5e1;font-weight:700;color:#0b3c91;font-size:15px;">Total</td><td style="padding:6px 0 0;border-top:1px solid #cbd5e1;text-align:right;font-weight:700;color:#0b3c91;font-size:15px;">${escapeHtml(currency)} ${total.toLocaleString()}</td></tr>
      </table>

      ${notes ? `<p style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;color:#1f2937;font-size:12px;"><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ""}

      <p style="margin-top:24px;color:#64748b;font-size:12px;">A PDF copy of this quotation is attached.</p>
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
