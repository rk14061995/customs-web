import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shipment from "@/models/Shipment";
import Payment from "@/models/Payment";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const shipmentIds = await Shipment.find({ customer: session.customerId }).distinct("_id");
  const payments = await Payment.find({ shipment: { $in: shipmentIds } })
    .sort({ createdAt: -1 })
    .populate("shipment", "trackingNumber origin destination")
    .lean();
  return NextResponse.json(payments);
}
