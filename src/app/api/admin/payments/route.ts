import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Payment from "@/models/Payment";
import "@/models/Shipment";
import "@/models/Customer";
import { generateInvoiceNumber, recomputeShipmentPaymentStatus } from "@/lib/shipmentUtils";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const docs = await Payment.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "shipment",
      select: "trackingNumber origin destination cost currency customer",
      populate: { path: "customer", select: "name company" },
    })
    .lean();

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const body = await req.json();

  try {
    const doc = await Payment.create({
      ...body,
      invoiceNumber: generateInvoiceNumber(),
    });
    await recomputeShipmentPaymentStatus(doc.shipment.toString());

    const populated = await doc.populate({
      path: "shipment",
      select: "trackingNumber origin destination cost currency customer",
      populate: { path: "customer", select: "name company" },
    });
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
