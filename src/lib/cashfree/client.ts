import { CashfreeApiError, type PaymentLinkResult } from "./types";

export { CashfreeApiError };

// Cashfree Payment Links API. Docs: https://www.cashfree.com/docs/payments/online/links
// Base URL selects sandbox vs production — override via CASHFREE_API_BASE_URL.
const CASHFREE_BASE_URL = process.env.CASHFREE_API_BASE_URL ?? "https://sandbox.cashfree.com/pg";
const CASHFREE_API_VERSION = "2023-08-01";

function getAuthHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new CashfreeApiError("Cashfree is not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.");
  }
  return {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": CASHFREE_API_VERSION,
    "Content-Type": "application/json",
  };
}

function normalizeLink(data: {
  link_id: string;
  link_url: string;
  link_status: string;
}): PaymentLinkResult {
  return { linkId: data.link_id, linkUrl: data.link_url, status: data.link_status };
}

export async function createPaymentLink({
  linkId,
  amount,
  currency,
  purpose,
  customerName,
  customerEmail,
  customerPhone,
  notifyUrl,
}: {
  linkId: string;
  amount: number;
  currency: string;
  purpose: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notifyUrl?: string;
}): Promise<PaymentLinkResult> {
  const headers = getAuthHeaders();

  const res = await fetch(`${CASHFREE_BASE_URL}/links`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      link_id: linkId,
      link_amount: amount,
      link_currency: currency,
      link_purpose: purpose,
      customer_details: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      link_notify: { send_sms: false, send_email: false },
      link_meta: notifyUrl ? { notify_url: notifyUrl } : undefined,
    }),
  });

  if (!res.ok) {
    throw new CashfreeApiError(`Cashfree payment link creation failed (${res.status}): ${await res.text()}`);
  }

  return normalizeLink(await res.json());
}

export async function getPaymentLinkStatus(linkId: string): Promise<PaymentLinkResult> {
  const headers = getAuthHeaders();

  const res = await fetch(`${CASHFREE_BASE_URL}/links/${encodeURIComponent(linkId)}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new CashfreeApiError(`Cashfree payment link lookup failed (${res.status}): ${await res.text()}`);
  }

  return normalizeLink(await res.json());
}
