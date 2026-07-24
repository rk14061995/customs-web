import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Shipment, { type IShipmentEvent } from "@/models/Shipment";
import "@/models/Customer";
import "@/models/Carrier";
import type { ICarrier } from "@/models/Carrier";
import {
  CarrierApiError,
  fetchCarrierTracking,
  isTrackableProvider,
  mapShip24Milestone,
} from "@/lib/carriers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const shipment = await Shipment.findById(id).populate<{ carrier: ICarrier | null }>("carrier");
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const provider = shipment.carrier?.provider;
  if (!provider || !isTrackableProvider(provider)) {
    return NextResponse.json(
      { error: "This shipment's carrier is not set up for live tracking sync. Set the carrier's provider to Ship24, UPS, FedEx or DHL." },
      { status: 400 }
    );
  }

  if (!shipment.carrierTrackingNumber) {
    return NextResponse.json(
      { error: "Add the carrier's tracking/AWB number to this shipment before syncing." },
      { status: 400 }
    );
  }

  try {
    const normalized = await fetchCarrierTracking(provider, shipment.carrierTrackingNumber, {
      courierCode: shipment.carrier?.ship24CourierCode,
    });

    const existingKeys = new Set(shipment.events.map((e: IShipmentEvent) => `${e.date}|${e.status}`));
    const newEvents = normalized.events
      .map((e) => ({
        status: mapShip24Milestone(e.milestone, e.description),
        location: e.location,
        date: e.date,
        completed: true,
      }))
      .filter((e) => !existingKeys.has(`${e.date}|${e.status}`));

    if (newEvents.length > 0) {
      shipment.events = [...shipment.events, ...newEvents].sort((a, b) => a.date.localeCompare(b.date));
      // The merged timeline is now chronological — the last entry is the most recent known status.
      shipment.status = shipment.events[shipment.events.length - 1].status;
    }

    if (normalized.estimatedDelivery) {
      shipment.actualDelivery =
        shipment.status === "Delivered" ? normalized.estimatedDelivery : shipment.actualDelivery;
      shipment.estimatedDelivery = normalized.estimatedDelivery;
    }

    await shipment.save();
    const populated = await shipment.populate([
      { path: "customer", select: "name company email phone" },
      { path: "carrier", select: "name provider" },
    ]);

    return NextResponse.json({ shipment: populated, newEventCount: newEvents.length });
  } catch (err) {
    if (err instanceof CarrierApiError) {
      return NextResponse.json({ error: err.message, provider: err.provider }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Failed to sync carrier tracking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
