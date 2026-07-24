import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Shipment from "@/models/Shipment";
import Payment from "@/models/Payment";
import "@/models/Customer";
import "@/models/Carrier";
import { recomputeShipmentPaymentStatus } from "@/lib/shipmentUtils";

async function requireSession() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  await dbConnect();
  const { id } = await params;
  const doc = await Shipment.findById(id)
    .populate("customer", "name company email phone")
    .populate("carrier", "name provider")
    .lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  // trackingNumber is immutable once assigned
  delete body.trackingNumber;

  try {
    const doc = await Shipment.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (typeof body.cost === "number") {
      await recomputeShipmentPaymentStatus(id);
    }

    const populated = await doc.populate([
      { path: "customer", select: "name company email phone" },
      { path: "carrier", select: "name provider" },
    ]);
    return NextResponse.json(populated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update shipment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;
  await dbConnect();
  const { id } = await params;
  await Payment.deleteMany({ shipment: id });
  await Shipment.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
