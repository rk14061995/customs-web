export type CarrierApiProvider = "UPS" | "FedEx" | "DHL" | "Ship24";

export type NormalizedCarrierEvent = {
  /** Raw status text/description as reported by the carrier. */
  description: string;
  location: string;
  /** ISO date (YYYY-MM-DD) the event occurred. */
  date: string;
  /** Ship24's own normalized milestone code for this event, when available — preferred over text-matching. */
  milestone?: string;
  /** Ship24's detected courier code for this event (e.g. "ups", "india-post"), when available. */
  courierCode?: string;
};

export type NormalizedTracking = {
  provider: CarrierApiProvider;
  trackingNumber: string;
  /** Raw carrier status text for the most recent event. */
  currentStatus: string;
  estimatedDelivery?: string;
  events: NormalizedCarrierEvent[];
  /** Origin/destination, when the provider reports them (currently only Ship24). */
  origin?: string;
  destination?: string;
  /** Detected courier code (Ship24 only), e.g. "ups", "india-post". */
  courierCode?: string;
};

/** Raised for both "not configured" and upstream API failures so callers can show a clear message. */
export class CarrierApiError extends Error {
  constructor(
    public provider: CarrierApiProvider,
    message: string
  ) {
    super(message);
    this.name = "CarrierApiError";
  }
}

/**
 * Best-effort mapping from a carrier's free-text status to our internal
 * shipment status vocabulary (Booked, Picked Up, In Transit, Customs
 * Clearance, Out For Delivery, Delivered, On Hold, Cancelled).
 */
export function mapToInternalStatus(rawStatus: string): string {
  const s = rawStatus.toLowerCase();
  if (s.includes("delivered")) return "Delivered";
  if (s.includes("out for delivery") || s.includes("on vehicle for delivery")) return "Out For Delivery";
  if (s.includes("customs") || s.includes("clearance")) return "Customs Clearance";
  if (s.includes("exception") || s.includes("hold") || s.includes("delay")) return "On Hold";
  if (s.includes("cancel") || s.includes("void")) return "Cancelled";
  if (s.includes("picked up") || s.includes("pickup") || s.includes("collected")) return "Picked Up";
  if (
    s.includes("label created") ||
    s.includes("shipment information") ||
    s.includes("order processed") ||
    s.includes("booked")
  )
    return "Booked";
  if (s.includes("transit") || s.includes("departed") || s.includes("arrived") || s.includes("in-flight"))
    return "In Transit";
  return "In Transit";
}

const KNOWN_COURIER_NAMES: Record<string, string> = {
  ups: "UPS",
  fedex: "FedEx",
  dhl: "DHL",
  usps: "USPS",
  "india-post": "India Post",
  "royal-mail": "Royal Mail",
};

/** Turns a Ship24 courier code like "india-post" into a display name like "India Post". */
export function formatCourierName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (KNOWN_COURIER_NAMES[code]) return KNOWN_COURIER_NAMES[code];
  return code
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Ship24 tags every event with one of its own normalized "statusMilestone"
 * codes, which is more reliable than text-matching. Falls back to
 * mapToInternalStatus(description) for anything unrecognized.
 */
export function mapShip24Milestone(milestone: string | undefined, description: string): string {
  switch (milestone) {
    case "delivered":
      return "Delivered";
    case "out_for_delivery":
    case "available_for_pickup":
      return "Out For Delivery";
    case "failed_attempt":
    case "exception":
      return "On Hold";
    case "expired":
      return "Cancelled";
    case "in_transit":
    case "transit":
      return "In Transit";
    case "pending":
    case "info_received":
      return "Booked";
    default:
      return mapToInternalStatus(description);
  }
}
