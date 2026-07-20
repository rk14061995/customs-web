import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Tracking from "@/models/Tracking";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  await dbConnect();
  const result = await Tracking.findOne({ trackingNumber: number.toUpperCase() }).lean();

  if (!result) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
