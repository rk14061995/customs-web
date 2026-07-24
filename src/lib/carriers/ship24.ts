import { CarrierApiError, type NormalizedTracking } from "./types";

// Ship24 Tracking API — a single API key covers ~1200 couriers worldwide
// (including UPS/FedEx/DHL), so it's normally the easiest provider to wire up.
// Docs: https://docs.ship24.com/api/tracker/#track-a-shipment
const SHIP24_BASE_URL = process.env.SHIP24_API_BASE_URL ?? "https://api.ship24.com/public/v1";

type Ship24Event = {
  occurrenceDatetime?: string;
  datetime?: string;
  status?: string;
  location?: string;
  statusMilestone?: string;
  courierCode?: string;
};

type Ship24Tracking = {
  tracker?: { courierCode?: string[] };
  shipment?: {
    statusMilestone?: string;
    originCountryCode?: string;
    destinationCountryCode?: string;
    delivery?: { estimatedDeliveryDate?: string };
    recipient?: { city?: string; subdivision?: string };
  };
  events?: Ship24Event[];
};

export async function fetchShip24Tracking(
  trackingNumber: string,
  courierCode?: string
): Promise<NormalizedTracking> {
  const apiKey = process.env.SHIP24_API_KEY;
  if (!apiKey) {
    throw new CarrierApiError("Ship24", "Ship24 is not configured. Set SHIP24_API_KEY.");
  }

  const res = await fetch(`${SHIP24_BASE_URL}/trackers/track`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      trackingNumber,
      ...(courierCode ? { courierCode } : {}),
    }),
  });

  if (!res.ok) {
    throw new CarrierApiError("Ship24", `Ship24 tracking lookup failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const tracking: Ship24Tracking | undefined = data?.data?.trackings?.[0];
  if (!tracking) {
    throw new CarrierApiError("Ship24", "Ship24 returned no tracking data for this number.");
  }

  const rawEvents = tracking.events ?? [];
  const currentStatus = rawEvents[0]?.status ?? tracking.shipment?.statusMilestone ?? "In Transit";

  const events =
    rawEvents.length > 0
      ? [...rawEvents]
          .reverse() // Ship24 returns most-recent-first; we want chronological
          .map((e) => ({
            description: e.status ?? "Update",
            location: e.location || "In Transit",
            date: (e.occurrenceDatetime ?? e.datetime ?? new Date().toISOString()).slice(0, 10),
            milestone: e.statusMilestone,
            courierCode: e.courierCode,
          }))
      : // Some couriers report a shipment-level status with no discrete events yet.
        [
          {
            description: currentStatus,
            location: "In Transit",
            date: new Date().toISOString().slice(0, 10),
            milestone: tracking.shipment?.statusMilestone,
            courierCode: tracking.tracker?.courierCode?.[0],
          },
        ];

  const recipient = tracking.shipment?.recipient;
  const destination =
    [recipient?.city, recipient?.subdivision].filter(Boolean).join(", ") ||
    tracking.shipment?.destinationCountryCode ||
    undefined;

  return {
    provider: "Ship24",
    trackingNumber,
    currentStatus,
    estimatedDelivery: tracking.shipment?.delivery?.estimatedDeliveryDate?.slice(0, 10),
    events,
    origin: events[0]?.location || tracking.shipment?.originCountryCode || undefined,
    destination,
    courierCode: events[events.length - 1]?.courierCode ?? tracking.tracker?.courierCode?.[0],
  };
}
