import ShipmentModel from "@/models/Shipment";
import PaymentModel from "@/models/Payment";

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
