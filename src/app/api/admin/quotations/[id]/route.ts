import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Quotation from "@/models/Quotation";
import "@/models/Customer";
import { computeQuotationTotals } from "@/lib/quotationUtils";

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
  const doc = await Quotation.findById(id).populate("customer", "name company email phone").lean();
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
  // quoteNumber is immutable once assigned
  delete body.quoteNumber;

  const existing = await Quotation.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const charges = body.charges ?? existing.charges;
  const weightKg = body.weightKg ?? existing.weightKg;
  const taxRate = typeof body.taxRate === "number" ? body.taxRate : existing.taxRate;
  const { subtotal, taxAmount, total } = computeQuotationTotals(charges, weightKg, taxRate);

  try {
    const doc = await Quotation.findByIdAndUpdate(
      id,
      { ...body, taxRate, subtotal, taxAmount, total },
      { new: true, runValidators: true }
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const populated = await doc.populate("customer", "name company email phone");
    return NextResponse.json(populated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update quotation";
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
  await Quotation.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
