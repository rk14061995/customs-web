import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import "@/models/Shipment";
import "@/models/Customer";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const docs = await Agreement.find()
    .sort({ createdAt: -1 })
    .populate("shipment", "trackingNumber origin destination")
    .populate("customer", "name company email")
    .select("-template -signature.signatureDataUrl")
    .lean();

  return NextResponse.json(docs);
}
