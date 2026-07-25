import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Payment from "@/models/Payment";
import "@/models/Shipment";
import "@/models/Customer";
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
  const doc = await Payment.findById(id)
    .populate({
      path: "shipment",
      select: "trackingNumber origin destination cost currency customer",
      populate: { path: "customer", select: "name company" },
    })
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
  delete body.invoiceNumber;
  delete body.paymentLinkId;
  delete body.paymentLinkUrl;
  delete body.paymentLinkStatus;

  try {
    const doc = await Payment.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await recomputeShipmentPaymentStatus(doc.shipment.toString());

    const populated = await doc.populate({
      path: "shipment",
      select: "trackingNumber origin destination cost currency customer",
      populate: { path: "customer", select: "name company" },
    });
    return NextResponse.json(populated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update payment";
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
  const doc = await Payment.findByIdAndDelete(id);
  if (doc) await recomputeShipmentPaymentStatus(doc.shipment.toString());
  return NextResponse.json({ success: true });
}
