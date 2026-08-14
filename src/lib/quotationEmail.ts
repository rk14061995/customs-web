import crypto from "crypto";
import type { FilterQuery } from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Quotation, { type IQuotation } from "@/models/Quotation";
import Settings from "@/models/Settings";
import "@/models/Customer";
import type { ICustomer } from "@/models/Customer";
import type { ISettings } from "@/models/Settings";
import type { IQuoteCharge } from "@/models/Quotation";
import type { QuotationPdfFields } from "@/lib/quotationPdf";
import { computeChargeAmount, computeQuotationTotals, formatChargeBasis } from "@/lib/quotationUtils";
import { renderQuotationEmailHtml } from "@/lib/mail";

type QuotationPdfResult =
  | { error: string; status: 404 | 400 }
  | { quoteNumber: string; pdfFields: QuotationPdfFields };

/** Fetches a quotation (by Mongo id or share token) and assembles the fields needed to PDF-render it. */
async function buildQuotationPdfFields(filter: FilterQuery<IQuotation>): Promise<QuotationPdfResult> {
  await dbConnect();

  const quotation = await Quotation.findOne(filter).populate<{ customer: ICustomer | null }>(
    "customer",
    "name company email phone"
  );
  if (!quotation) return { error: "Not found", status: 404 as const };

  const customer = quotation.customer;
  if (!customer) {
    return { error: "This quotation has no customer on file.", status: 400 as const };
  }

  const settings = (await Settings.findOne().lean()) as ISettings | null;

  const { baseAmount } = computeQuotationTotals(quotation.charges, quotation.weightKg, quotation.taxRate);
  const charges = quotation.charges.map((c: IQuoteCharge) => ({
    label: c.label,
    basisLabel: formatChargeBasis(c, quotation.currency, quotation.weightKg),
    amount: computeChargeAmount(c, quotation.weightKg, baseAmount),
  }));

  const pdfFields = {
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

  return { quoteNumber: quotation.quoteNumber, pdfFields };
}

export const buildQuotationPdfFieldsById = (id: string): Promise<QuotationPdfResult> =>
  buildQuotationPdfFields({ _id: id });
export const buildQuotationPdfFieldsByToken = (token: string): Promise<QuotationPdfResult> =>
  buildQuotationPdfFields({ shareToken: token });

type QuotationEmailResult =
  | { error: string; status: 404 | 400 }
  | { quoteNumber: string; to: string; subject: string; html: string; emailFields: QuotationPdfFields };

/** Fetches a quotation and assembles everything needed to preview, PDF-render, or send its customer email. */
export async function buildQuotationEmail(id: string): Promise<QuotationEmailResult> {
  const result = await buildQuotationPdfFieldsById(id);
  if ("error" in result) return result;

  const { quoteNumber, pdfFields } = result;
  if (!pdfFields.customerEmail) {
    return {
      error: "This customer has no email on file — add one before sending the quotation.",
      status: 400 as const,
    };
  }

  return {
    quoteNumber,
    to: pdfFields.customerEmail,
    subject: `Quotation ${quoteNumber} — Rana Forwarder`,
    html: renderQuotationEmailHtml(pdfFields),
    emailFields: pdfFields,
  };
}

/** Returns the quotation's persistent public-PDF share token, generating and saving one on first use. */
export async function ensureQuotationShareToken(id: string) {
  await dbConnect();
  const quotation = await Quotation.findById(id);
  if (!quotation) return null;
  if (!quotation.shareToken) {
    quotation.shareToken = crypto.randomBytes(24).toString("hex");
    await quotation.save();
  }
  return quotation.shareToken;
}
