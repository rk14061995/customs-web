import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Quotation from "@/models/Quotation";
import "@/models/Customer";
import type { ICustomer } from "@/models/Customer";
import type { IQuoteCharge } from "@/models/Quotation";
import { computeChargeAmount, computeQuotationTotals } from "@/lib/quotationUtils";
import { renderQuotationEmailHtml, sendCustomerConfirmationEmail } from "@/lib/mail";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const quotation = await Quotation.findById(id).populate<{ customer: ICustomer | null }>(
    "customer",
    "name email"
  );
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customer = quotation.customer;
  if (!customer?.email) {
    return NextResponse.json(
      { error: "This customer has no email on file — add one before sending the quotation." },
      { status: 400 }
    );
  }

  const { baseAmount } = computeQuotationTotals(quotation.charges, quotation.weightKg, quotation.taxRate);
  const charges = quotation.charges.map((c: IQuoteCharge) => ({
    label: c.label,
    amount: computeChargeAmount(c, quotation.weightKg, baseAmount),
  }));

  try {
    await sendCustomerConfirmationEmail({
      to: customer.email,
      subject: `Quotation ${quotation.quoteNumber} — Rana Forwarder`,
      html: renderQuotationEmailHtml({
        quoteNumber: quotation.quoteNumber,
        customerName: customer.name,
        origin: quotation.origin,
        destination: quotation.destination,
        serviceType: quotation.serviceType,
        weightKg: quotation.weightKg,
        currency: quotation.currency,
        charges,
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        total: quotation.total,
        notes: quotation.notes,
      }),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
