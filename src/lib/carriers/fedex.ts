import { CarrierApiError, type NormalizedTracking } from "./types";

// FedEx OAuth2 client-credentials + Track API v1.
// Docs: https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html
const FEDEX_BASE_URL = process.env.FEDEX_API_BASE_URL ?? "https://apis.fedex.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new CarrierApiError("FedEx", "FedEx is not configured. Set FEDEX_CLIENT_ID and FEDEX_CLIENT_SECRET.");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${FEDEX_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    throw new CarrierApiError("FedEx", `FedEx authentication failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export async function fetchFedexTracking(trackingNumber: string): Promise<NormalizedTracking> {
  const token = await getAccessToken();

  const res = await fetch(`${FEDEX_BASE_URL}/track/v1/trackingnumbers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-locale": "en_US",
    },
    body: JSON.stringify({
      includeDetailedScans: true,
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
    }),
  });

  if (!res.ok) {
    throw new CarrierApiError("FedEx", `FedEx tracking lookup failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const trackResult = data?.output?.completeTrackResults?.[0]?.trackResults?.[0];
  if (!trackResult) {
    throw new CarrierApiError("FedEx", "FedEx returned no tracking data for this number.");
  }

  type FedexScanEvent = {
    date?: string;
    eventDescription?: string;
    scanLocation?: { city?: string; stateOrProvinceCode?: string; countryCode?: string };
  };

  const scanEvents: FedexScanEvent[] = trackResult.scanEvents ?? [];
  const events = [...scanEvents]
    .reverse() // FedEx returns most-recent-first; we want chronological
    .map((e) => {
      const loc = e.scanLocation;
      const location = [loc?.city, loc?.stateOrProvinceCode, loc?.countryCode].filter(Boolean).join(", ");
      return {
        description: e.eventDescription ?? "Update",
        location: location || "In Transit",
        date: (e.date ?? new Date().toISOString()).slice(0, 10),
      };
    });

  const currentStatus = trackResult.latestStatusDetail?.description ?? "In Transit";
  const estimatedDelivery = trackResult.dateAndTimes?.find(
    (d: { type?: string; dateTime?: string }) => d.type === "ESTIMATED_DELIVERY"
  )?.dateTime;

  return {
    provider: "FedEx",
    trackingNumber,
    currentStatus,
    estimatedDelivery: estimatedDelivery ? String(estimatedDelivery).slice(0, 10) : undefined,
    events,
  };
}
