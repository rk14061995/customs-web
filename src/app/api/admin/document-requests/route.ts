import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import DocumentRequest from "@/models/DocumentRequest";
import "@/models/Shipment";
import "@/models/Customer";
import "@/models/DocumentTemplate";
import "@/models/DocumentUpload";

/** Lists every shipment's document set — provisioned automatically alongside its Agreement (see ensureAgreement). */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const docs = await DocumentRequest.find()
    .sort({ createdAt: -1 })
    .populate("shipment", "trackingNumber origin destination")
    .populate("customer", "name company email")
    .populate("items.template", "title category")
    .populate("items.upload", "fileName uploadedAt")
    .lean();

  return NextResponse.json(docs);
}
