import { CarrierApiError, type NormalizedTracking } from "./types";

// UPS OAuth2 client-credentials + Track API v1.
// Docs: https://developer.ups.com/api/reference/oauth/client_credentials
//       https://developer.ups.com/api/reference/tracking/appendix
const UPS_BASE_URL = process.env.UPS_API_BASE_URL ?? "https://onlinetools.ups.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.UPS_CLIENT_ID;
  const clientSecret = process.env.UPS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new CarrierApiError("UPS", "UPS is not configured. Set UPS_CLIENT_ID and UPS_CLIENT_SECRET.");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${UPS_BASE_URL}/security/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new CarrierApiError("UPS", `UPS authentication failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: string };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
  };
  return cachedToken.token;
}

function formatUpsDate(date?: string): string {
  if (!date || date.length !== 8) return new Date().toISOString().slice(0, 10);
  const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  return iso;
}

export async function fetchUpsTracking(trackingNumber: string): Promise<NormalizedTracking> {
  const token = await getAccessToken();

  const res = await fetch(
    `${UPS_BASE_URL}/api/track/v1/details/${encodeURIComponent(trackingNumber)}?locale=en_US&returnSignature=false`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        transId: `rana-${Date.now()}`,
        transactionSrc: "rana-forwarder-admin",
      },
    }
  );

  if (!res.ok) {
    throw new CarrierApiError("UPS", `UPS tracking lookup failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const pkg = data?.trackResponse?.shipment?.[0]?.package?.[0];
  if (!pkg) {
    throw new CarrierApiError("UPS", "UPS returned no tracking data for this number.");
  }

  type UpsActivity = {
    status?: { description?: string };
    location?: { address?: { city?: string; stateProvince?: string; countryCode?: string } };
    date?: string;
    time?: string;
  };

  const activities: UpsActivity[] = pkg.activity ?? [];
  const events = activities
    .map((a) => {
      const addr = a.location?.address;
      const location = [addr?.city, addr?.stateProvince, addr?.countryCode].filter(Boolean).join(", ");
      return {
        description: a.status?.description ?? "Update",
        location: location || "In Transit",
        date: formatUpsDate(a.date),
      };
    })
    .reverse(); // UPS returns most-recent-first; we want chronological

  const currentStatus = activities[0]?.status?.description ?? "In Transit";
  const deliveryDate = pkg.deliveryDate?.[0]?.date;

  return {
    provider: "UPS",
    trackingNumber,
    currentStatus,
    estimatedDelivery: deliveryDate ? formatUpsDate(deliveryDate) : undefined,
    events,
  };
}
