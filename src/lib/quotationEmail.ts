import dbConnect from "@/lib/dbConnect";
import Quotation from "@/models/Quotation";
import Settings from "@/models/Settings";
import "@/models/Customer";
import type { ICustomer } from "@/models/Customer";
import type { ISettings } from "@/models/Settings";
import type { IQuoteCharge } from "@/models/Quotation";
import { computeChargeAmount, computeQuotationTotals, formatChargeBasis } from "@/lib/quotationUtils";
import { renderQuotationEmailHtml } from "@/lib/mail";

/** Fetches a quotation and assembles everything needed to preview, PDF-render, or send its customer email. */
export async function buildQuotationEmail(id: string) {
  await dbConnect();

  const quotation = await Quotation.findById(id).populate<{ customer: ICustomer | null }>(
    "customer",
    "name company email phone"
  );
  if (!quotation) return { error: "Not found", status: 404 as const };

  const customer = quotation.customer;
  if (!customer?.email) {
    return {
      error: "This customer has no email on file — add one before sending the quotation.",
      status: 400 as const,
    };
  }

  const settings = (await Settings.findOne().lean()) as ISettings | null;

  const { baseAmount } = computeQuotationTotals(quotation.charges, quotation.weightKg, quotation.taxRate);
  const charges = quotation.charges.map((c: IQuoteCharge) => ({
    label: c.label,
    basisLabel: formatChargeBasis(c, quotation.currency, quotation.weightKg),
    amount: computeChargeAmount(c, quotation.weightKg, baseAmount),
  }));

  const emailFields = {
    quoteNumber: quotation.quoteNumber,
    createdAt: quotation.createdAt,
    customerName: customer.name,
    customerCompany: customer.company,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    origin: quotation.origin,
    destination: quotation.destination,
    serviceType: quotation.serviceType,
    weightKg: quotation.weightKg,
    quantity: quotation.quantity ?? 1,
    dimensions: quotation.dimensions,
    validUntil: quotation.validUntil,
    currency: quotation.currency,
    charges,
    subtotal: quotation.subtotal,
    taxRate: quotation.taxRate,
    taxAmount: quotation.taxAmount,
    total: quotation.total,
    notes: quotation.notes,
    companyEmail: settings?.email,
    companyPhone: settings?.alternatePhone
      ? `${settings.phone} / ${settings.alternatePhone}`
      : settings?.phone,
  };

  return {
    quoteNumber: quotation.quoteNumber,
    to: customer.email,
    subject: `Quotation ${quotation.quoteNumber} — Rana Forwarder`,
    html: renderQuotationEmailHtml(emailFields),
    emailFields,
  };
}
