import ShipmentModel from "@/models/Shipment";
import PaymentModel from "@/models/Payment";
import SettingsModel from "@/models/Settings";

function randomSuffix(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateTrackingNumber() {
  return `RF${Date.now().toString(36).toUpperCase()}${randomSuffix(3)}`;
}

export function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}${randomSuffix(3)}`;
}

export function generateQuoteNumber() {
  return `QT-${Date.now().toString(36).toUpperCase()}${randomSuffix(3)}`;
}

/**
 * Reserves the next bill/invoice number as a plain incrementing string (e.g. "301", "302", ...),
 * seeded from Settings.nextBillNumber (default 301, editable in Admin > Settings). Atomic via $inc
 * so concurrent admins never collide on the same number; the counter is bumped whether or not the
 * reserved bill is ever saved, so gaps can appear if an "Add Bill" draft is abandoned — same
 * trade-off most invoicing tools make. Requires the caller to have already called dbConnect().
 */
export async function generateBillNumber() {
  const existing = await SettingsModel.findOne({}, { nextBillNumber: 1 }).lean<{ nextBillNumber?: number }>();
  if (existing?.nextBillNumber == null) {
    // No counter seeded yet — either a fresh install, or (the common case here) a Settings doc
    // that predates this field. Seed it and reserve 301 for this call.
    await SettingsModel.updateOne({}, { $set: { nextBillNumber: 302 } }, { upsert: true });
    return "301";
  }
  const doc = await SettingsModel.findOneAndUpdate(
    {},
    { $inc: { nextBillNumber: 1 } },
    { new: false }
  ).lean<{ nextBillNumber?: number }>();
  return String(doc?.nextBillNumber ?? 301);
}

/** Recomputes a shipment's paymentStatus from its paid/refunded payment records. */
export async function recomputeShipmentPaymentStatus(shipmentId: string) {
  const shipment = await ShipmentModel.findById(shipmentId);
  if (!shipment) return;

  const payments = await PaymentModel.find({ shipment: shipmentId }).lean();
  const paidTotal = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const hasRefund = payments.some(
    (p) => p.status === "refunded" || p.status === "partially-refunded"
  );

  let paymentStatus: "unpaid" | "partial" | "paid" | "refunded" = "unpaid";
  if (hasRefund && paidTotal <= 0) {
    paymentStatus = "refunded";
  } else if (paidTotal >= shipment.cost && shipment.cost > 0) {
    paymentStatus = "paid";
  } else if (paidTotal > 0) {
    paymentStatus = "partial";
  }

  shipment.paymentStatus = paymentStatus;
  await shipment.save();
}
