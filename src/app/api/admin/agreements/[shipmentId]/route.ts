import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import "@/models/Shipment";
import "@/models/Customer";
import { getAdminSession } from "@/lib/auth";
import { ensureAgreement } from "@/lib/agreements";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipmentId } = await params;

  try {
    await ensureAgreement(shipmentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate agreement";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await dbConnect();
  const doc = await Agreement.findOne({ shipment: shipmentId })
    .populate("shipment", "trackingNumber origin destination")
    .populate("customer", "name company email")
    .select("-signature.signatureDataUrl")
    .lean();

  return NextResponse.json(doc);
}
