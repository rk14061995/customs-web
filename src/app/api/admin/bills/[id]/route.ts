import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Bill from "@/models/Bill";
import "@/models/Customer";
import "@/models/Shipment";
import { computeBillTotals } from "@/lib/billUtils";

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
  const doc = await Bill.findById(id)
    .populate("customer", "name company email phone")
    .populate("shipment", "trackingNumber origin destination")
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
  // billNumber is immutable once assigned
  delete body.billNumber;

  const existing = await Bill.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = body.items ?? existing.items;
  const taxRate = typeof body.taxRate === "number" ? body.taxRate : existing.taxRate;
  const { subtotal, taxAmount, total } = computeBillTotals(items, taxRate);

  try {
    const doc = await Bill.findByIdAndUpdate(
      id,
      { ...body, shipment: body.shipment || undefined, taxRate, subtotal, taxAmount, total },
      { new: true, runValidators: true }
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const populated = await doc.populate([
      { path: "customer", select: "name company email phone" },
      { path: "shipment", select: "trackingNumber origin destination" },
    ]);
    return NextResponse.json(populated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update bill";
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
  await Bill.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
