import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shipment from "@/models/Shipment";
import "@/models/Carrier";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const shipments = await Shipment.find({ customer: session.customerId })
    .sort({ createdAt: -1 })
    .populate("carrier", "name")
    .lean();
  return NextResponse.json(shipments);
}
