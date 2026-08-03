import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import Shipment from "@/models/Shipment";
import "@/models/Customer";
import type { ICustomer } from "@/models/Customer";
import { getAdminSession } from "@/lib/auth";
import { generateAgreementPdf } from "@/lib/agreementPdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { shipmentId } = await params;
  const timeZone = req.nextUrl.searchParams.get("tz") || undefined;

  const agreement = await Agreement.findOne({ shipment: shipmentId });
  if (!agreement) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });

  const shipment = await Shipment.findById(shipmentId).populate<{ customer: ICustomer }>("customer");
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

  const pdf = await generateAgreementPdf({
    template: agreement.template,
    customerName: shipment.customer?.name ?? "Customer",
    customerAddress: shipment.customer?.address,
    customerPhone: shipment.customer?.phone,
    trackingNumber: shipment.trackingNumber,
    signature: agreement.signature,
    timeZone,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="agreement-${shipment.trackingNumber}.pdf"`,
    },
  });
}
