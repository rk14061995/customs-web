import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bill from "@/models/Bill";
import "@/models/Customer";
import "@/models/Shipment";
import type { ICustomer } from "@/models/Customer";
import type { IShipment } from "@/models/Shipment";
import { getAdminSession } from "@/lib/auth";
import { generateBillPdf } from "@/lib/billPdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const bill = await Bill.findById(id).populate<{
    customer: ICustomer;
    shipment: IShipment | null;
  }>(["customer", "shipment"]);
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  const pdf = await generateBillPdf({
    billNumber: bill.billNumber,
    billDate: bill.billDate,
    dueDate: bill.dueDate,
    customerName: bill.customer?.name ?? "Customer",
    customerCompany: bill.customer?.company,
    customerEmail: bill.customer?.email,
    customerPhone: bill.customer?.phone,
    shipmentTrackingNumber: bill.shipment?.trackingNumber,
    currency: bill.currency,
    items: bill.items,
    subtotal: bill.subtotal,
    taxRate: bill.taxRate,
    taxAmount: bill.taxAmount,
    total: bill.total,
    status: bill.status,
    notes: bill.notes,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${bill.billNumber}.pdf"`,
    },
  });
}
