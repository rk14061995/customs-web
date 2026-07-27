import type { IQuoteCharge } from "@/models/Quotation";

/** A charge line is either a flat amount, or a rate applied per kg of the quotation's weight. */
export function computeChargeAmount(charge: Pick<IQuoteCharge, "basis" | "rate">, weightKg: number) {
  const rate = Number(charge.rate) || 0;
  return charge.basis === "per_kg" ? rate * (Number(weightKg) || 0) : rate;
}

/** Sums all charge lines into a subtotal, then applies tax (e.g. India GST 18%) on top. */
export function computeQuotationTotals(
  charges: Pick<IQuoteCharge, "basis" | "rate">[],
  weightKg: number,
  taxRate: number
) {
  const subtotal = charges.reduce((sum, c) => sum + computeChargeAmount(c, weightKg), 0);
  const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}
