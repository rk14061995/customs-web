import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Bill from "@/models/Bill";
import "@/models/Customer";
import "@/models/Shipment";
import { generateBillNumber } from "@/lib/shipmentUtils";
import { computeBillTotals } from "@/lib/billUtils";

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
    filter.billNumber = { $regex: search, $options: "i" };
  }

  const docs = await Bill.find(filter)
    .sort({ createdAt: -1 })
    .populate("customer", "name company email phone")
    .populate("shipment", "trackingNumber origin destination")
    .lean();

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const body = await req.json();

  try {
    const taxRate = typeof body.taxRate === "number" ? body.taxRate : 0;
    const items = body.items ?? [];
    const { subtotal, taxAmount, total } = computeBillTotals(items, taxRate);

    const doc = await Bill.create({
      ...body,
      billNumber: generateBillNumber(),
      shipment: body.shipment || undefined,
      taxRate,
      subtotal,
      taxAmount,
      total,
    });
    const populated = await doc.populate([
      { path: "customer", select: "name company email phone" },
      { path: "shipment", select: "trackingNumber origin destination" },
    ]);
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create bill";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
