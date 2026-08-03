import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import "@/models/Shipment";
import "@/models/Customer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  await dbConnect();
  const { token } = await params;

  const agreement = await Agreement.findOne({ token })
    .populate("shipment", "trackingNumber origin destination")
    .populate("customer", "name");

  if (!agreement) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });

  if (agreement.status === "pending" && agreement.expiresAt < new Date()) {
    return NextResponse.json({ error: "This signing link has expired" }, { status: 410 });
  }

  return NextResponse.json(agreement);
}
