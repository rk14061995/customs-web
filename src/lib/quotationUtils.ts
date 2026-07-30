import type { IQuoteCharge } from "@/models/Quotation";

/** A charge line is a flat amount, a rate per kg, or a percentage applied on the flat/per-kg subtotal (e.g. Fuel Charge, Demand Charge — same way GST is applied on top).
 * Always rounded to a whole number — quotations don't show decimal amounts. */
export function computeChargeAmount(
  charge: Pick<IQuoteCharge, "basis" | "rate">,
  weightKg: number,
  baseAmount = 0
) {
  const rate = Number(charge.rate) || 0;
  if (charge.basis === "per_kg") return Math.round(rate * (Number(weightKg) || 0));
  if (charge.basis === "percent") return Math.round(baseAmount * (rate / 100));
  return Math.round(rate);
}

/** Sums all charge lines into a subtotal, then applies tax (e.g. India GST 18%) on top.
 * Percent-basis charges (e.g. Fuel Charge, Demand Charge) are computed only on the freight
 * amount (per-kg rate × weight) — flat charges and other percent charges don't affect them.
 * GST is then computed on the full subtotal of all charges, itself included last. */
export function computeQuotationTotals(
  charges: Pick<IQuoteCharge, "basis" | "rate">[],
  weightKg: number,
  taxRate: number
) {
  const baseAmount = charges.reduce(
    (sum, c) => sum + (c.basis === "per_kg" ? computeChargeAmount(c, weightKg) : 0),
    0
  );
  const subtotal = charges.reduce((sum, c) => sum + computeChargeAmount(c, weightKg, baseAmount), 0);
  const taxAmount = Math.round(subtotal * ((Number(taxRate) || 0) / 100));
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total, baseAmount };
}

/** Human-readable description of how a charge line is calculated, e.g. "INR 273.10/kg × 127kg", "18%", "Flat". */
export function formatChargeBasis(
  charge: Pick<IQuoteCharge, "basis" | "rate">,
  currency: string,
  weightKg: number
) {
  if (charge.basis === "per_kg") return `${currency} ${charge.rate}/kg × ${weightKg}kg`;
  if (charge.basis === "percent") return `${charge.rate}%`;
  return "Flat";
}
