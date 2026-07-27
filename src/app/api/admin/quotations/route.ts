import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Quotation from "@/models/Quotation";
import "@/models/Customer";
import { generateQuoteNumber } from "@/lib/shipmentUtils";
import { computeQuotationTotals } from "@/lib/quotationUtils";

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
      { quoteNumber: { $regex: search, $options: "i" } },
      { origin: { $regex: search, $options: "i" } },
      { destination: { $regex: search, $options: "i" } },
    ];
  }

  const docs = await Quotation.find(filter)
    .sort({ createdAt: -1 })
    .populate("customer", "name company email phone")
    .lean();

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const body = await req.json();

  try {
    const taxRate = typeof body.taxRate === "number" ? body.taxRate : 18;
    const { subtotal, taxAmount, total } = computeQuotationTotals(
      body.charges ?? [],
      body.weightKg,
      taxRate
    );
    const doc = await Quotation.create({
      ...body,
      quoteNumber: generateQuoteNumber(),
      status: "draft",
      taxRate,
      subtotal,
      taxAmount,
      total,
    });
    const populated = await doc.populate("customer", "name company email phone");
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create quotation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
