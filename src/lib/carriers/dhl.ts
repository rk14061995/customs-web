import { CarrierApiError, type NormalizedTracking } from "./types";

// DHL Unified Shipment Tracking API (API-key auth, no OAuth step needed).
// Docs: https://developer.dhl.com/api-reference/shipment-tracking
const DHL_BASE_URL = process.env.DHL_API_BASE_URL ?? "https://api-eu.dhl.com";

export async function fetchDhlTracking(trackingNumber: string): Promise<NormalizedTracking> {
  const apiKey = process.env.DHL_API_KEY;
  if (!apiKey) {
    throw new CarrierApiError("DHL", "DHL is not configured. Set DHL_API_KEY.");
  }

  const res = await fetch(
    `${DHL_BASE_URL}/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
    { headers: { "DHL-API-Key": apiKey } }
  );

  if (!res.ok) {
    throw new CarrierApiError("DHL", `DHL tracking lookup failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const shipment = data?.shipments?.[0];
  if (!shipment) {
    throw new CarrierApiError("DHL", "DHL returned no tracking data for this number.");
  }

  type DhlEvent = {
    timestamp?: string;
    description?: string;
    status?: string;
    location?: { address?: { addressLocality?: string } };
  };

  const events: DhlEvent[] = shipment.events ?? [];
  const normalizedEvents = [...events]
    .reverse() // DHL returns most-recent-first; we want chronological
    .map((e) => ({
      description: e.description ?? e.status ?? "Update",
      location: e.location?.address?.addressLocality || "In Transit",
      date: (e.timestamp ?? new Date().toISOString()).slice(0, 10),
    }));

  const currentStatus = shipment.status?.description ?? shipment.status?.status ?? "In Transit";

  return {
    provider: "DHL",
    trackingNumber,
    currentStatus,
    estimatedDelivery: shipment.estimatedTimeOfDelivery
      ? String(shipment.estimatedTimeOfDelivery).slice(0, 10)
      : undefined,
    events: normalizedEvents,
  };
}
