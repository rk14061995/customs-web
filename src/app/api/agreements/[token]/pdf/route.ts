import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import "@/models/Shipment";
import "@/models/Customer";
import type { IShipment } from "@/models/Shipment";
import type { ICustomer } from "@/models/Customer";
import { generateAgreementPdf } from "@/lib/agreementPdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  await dbConnect();
  const { token } = await params;
  const timeZone = req.nextUrl.searchParams.get("tz") || undefined;

  const agreement = await Agreement.findOne({ token }).populate<{
    shipment: IShipment;
    customer: ICustomer;
  }>(["shipment", "customer"]);
  if (!agreement) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });

  const pdf = await generateAgreementPdf({
    template: agreement.template,
    customerName: agreement.customer?.name ?? "Customer",
    customerAddress: agreement.customer?.address,
    customerPhone: agreement.customer?.phone,
    trackingNumber: agreement.shipment?.trackingNumber ?? "-",
    signature: agreement.signature,
    timeZone,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="agreement-${agreement.shipment?.trackingNumber ?? token}.pdf"`,
    },
  });
}
