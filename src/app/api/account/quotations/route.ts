import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quotation from "@/models/Quotation";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const quotations = await Quotation.find({ customer: session.customerId })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(quotations);
}
