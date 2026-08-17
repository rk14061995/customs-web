import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bill from "@/models/Bill";
import "@/models/Customer";
import "@/models/Shipment";
import type { ICustomer } from "@/models/Customer";
import type { IShipment } from "@/models/Shipment";
import { getCustomerSession } from "@/lib/customerAuth";
import { generateBillPdf } from "@/lib/billPdf";
import { getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  // Scoped by customer, not just id — same rule as the quotation PDF route.
  const bill = await Bill.findOne({ _id: id, customer: session.customerId }).populate<{
    customer: ICustomer;
    shipment: IShipment | null;
  }>(["customer", "shipment"]);
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = await getSettings();
  const resolved = settings ?? siteConfig;
  const companyPhone = resolved.alternatePhone
    ? `${resolved.phone} / ${resolved.alternatePhone}`
    : resolved.phone;
  const companyName = "siteName" in resolved ? resolved.siteName : resolved.name;

  const pdf = await generateBillPdf({
    billNumber: bill.billNumber,
    billDate: bill.billDate,
    dueDate: bill.dueDate,
    customerName: bill.customer?.name ?? "Customer",
    customerCompany: bill.customer?.company,
    customerEmail: bill.customer?.email,
    customerPhone: bill.customer?.phone,
    customerAddress: bill.customer?.address,
    customerGstin: bill.customer?.gstNumber,
    customerState: bill.customer?.stateName,
    shipmentTrackingNumber: bill.shipment?.trackingNumber,
    currency: bill.currency,
    items: bill.items,
    subtotal: bill.subtotal,
    taxType: bill.taxType,
    taxRate: bill.taxRate,
    taxAmount: bill.taxAmount,
    total: bill.total,
    status: bill.status,
    notes: bill.notes,
    companyName,
    companyAddress: resolved.address,
    companyEmail: resolved.email,
    companyPhone,
    companyGstin: resolved.gstin,
    companyPan: resolved.pan,
    companyUdyam: resolved.udyamNumber,
    companyState: resolved.stateName && resolved.stateCode ? `${resolved.stateName}, Code: ${resolved.stateCode}` : resolved.stateName,
    jurisdiction: resolved.jurisdiction,
    bank: {
      accountHolder: resolved.bankAccountHolder,
      bankName: resolved.bankName,
      accountNumber: resolved.bankAccountNumber,
      branch: resolved.bankBranch,
      ifsc: resolved.bankIfsc,
    },
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${bill.billNumber}.pdf"`,
    },
  });
}
