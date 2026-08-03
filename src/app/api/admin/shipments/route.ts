import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Shipment from "@/models/Shipment";
import "@/models/Customer";
import "@/models/Carrier";
import { generateTrackingNumber } from "@/lib/shipmentUtils";
import { ensureAgreement } from "@/lib/agreements";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { trackingNumber: { $regex: search, $options: "i" } },
      { origin: { $regex: search, $options: "i" } },
      { destination: { $regex: search, $options: "i" } },
    ];
  }

  const docs = await Shipment.find(filter)
    .sort({ createdAt: -1 })
    .populate("customer", "name company email phone")
    .populate("carrier", "name provider")
    .lean();

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const body = await req.json();

  try {
    const today = new Date().toISOString().slice(0, 10);
    const doc = await Shipment.create({
      ...body,
      trackingNumber: generateTrackingNumber(),
      status: "Booked",
      paymentStatus: "unpaid",
      events: [
        { status: "Booked", location: body.origin, date: today, completed: true },
      ],
    });
    const populated = await doc.populate([
      { path: "customer", select: "name company email phone" },
      { path: "carrier", select: "name provider" },
    ]);

    try {
      await ensureAgreement(String(doc._id));
    } catch (err) {
      // Best-effort — the shipment is already booked; admin can retry from
      // the Agreements page if this fails.
      console.error("Failed to create booking agreement:", err);
    }

    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create shipment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
