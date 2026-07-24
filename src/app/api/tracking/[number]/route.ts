import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shipment, { type IShipmentEvent } from "@/models/Shipment";
import { fetchCarrierTracking, formatCourierName, mapShip24Milestone } from "@/lib/carriers";
import { checkRateLimit } from "@/lib/rateLimit";
import "@/models/Carrier";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type PublicShipmentLookup = {
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  events: IShipmentEvent[];
  serviceType: string;
  weight: string;
  dimensions?: string;
  packages: number;
  carrier?: { name: string } | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const cleaned = number.replace(/\s+/g, "").toUpperCase();

  await dbConnect();
  const result = await Shipment.findOne({
    $or: [
      { trackingNumber: cleaned },
      { carrierTrackingNumber: { $regex: `^${escapeRegExp(cleaned)}$`, $options: "i" } },
    ],
  })
    .select("trackingNumber status origin destination estimatedDelivery events serviceType weight dimensions packages carrier")
    .populate("carrier", "name")
    .lean<PublicShipmentLookup>();

  if (result) {
    return NextResponse.json({
      trackingNumber: result.trackingNumber,
      status: result.status,
      origin: result.origin,
      destination: result.destination,
      estimatedDelivery: result.estimatedDelivery,
      events: result.events,
      serviceType: result.serviceType,
      carrier: result.carrier?.name,
      weight: result.weight,
      dimensions: result.dimensions,
      packages: result.packages,
    });
  }

  // Not one of our own shipments — fall back to a live universal lookup via Ship24.
  // Ship24 creates a real tracker for almost any input rather than rejecting bad formats,
  // so a cheap sanity check keeps obvious junk from spending quota / cluttering the account.
  if (!/^[A-Z0-9]{8,}$/.test(cleaned)) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  // Rate-limited per IP since this is an unauthenticated endpoint spending a paid API quota.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`public-tracking:${ip}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many tracking requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  try {
    const normalized = await fetchCarrierTracking("Ship24", cleaned);
    const events = normalized.events.map((e) => ({
      status: mapShip24Milestone(e.milestone, e.description),
      location: e.location,
      date: e.date,
      completed: true,
    }));

    return NextResponse.json({
      trackingNumber: cleaned,
      status: events[events.length - 1]?.status ?? "Booked",
      origin: normalized.origin ?? "—",
      destination: normalized.destination ?? "—",
      estimatedDelivery: normalized.estimatedDelivery ?? "—",
      events,
      carrier: formatCourierName(normalized.courierCode),
    });
  } catch {
    // Ship24 not configured, or genuinely couldn't find this number — same public message either way.
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }
}
