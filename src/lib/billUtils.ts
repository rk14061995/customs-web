import type { IBillItem } from "@/models/Bill";

/** Sums item lines into a subtotal, then applies a single flat tax rate on top. */
export function computeBillTotals(items: Pick<IBillItem, "quantity" | "rate">[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const taxAmount = Math.round(subtotal * ((Number(taxRate) || 0) / 100));
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}
