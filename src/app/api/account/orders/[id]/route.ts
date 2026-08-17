import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shipment from "@/models/Shipment";
import "@/models/Carrier";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  // Scoped by customer, not just id — an id alone must never leak another customer's shipment.
  const shipment = await Shipment.findOne({ _id: id, customer: session.customerId })
    .populate("carrier", "name")
    .lean();
  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shipment);
}
