import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Payment from "@/models/Payment";
import "@/models/Shipment";
import "@/models/Customer";
import { CashfreeApiError, getPaymentLinkStatus } from "@/lib/cashfree/client";
import { recomputeShipmentPaymentStatus } from "@/lib/shipmentUtils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const payment = await Payment.findById(id);
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (!payment.paymentLinkId) {
    return NextResponse.json({ error: "No payment link has been sent for this invoice yet." }, { status: 400 });
  }

  try {
    const link = await getPaymentLinkStatus(payment.paymentLinkId);
    payment.paymentLinkStatus = link.status;

    if (link.status === "PAID" && payment.status !== "paid") {
      payment.status = "paid";
      payment.paidAt = new Date().toISOString().slice(0, 10);
    }

    await payment.save();
    if (payment.status === "paid") {
      await recomputeShipmentPaymentStatus(payment.shipment.toString());
    }

    const populated = await payment.populate({
      path: "shipment",
      select: "trackingNumber origin destination cost currency customer",
      populate: { path: "customer", select: "name company" },
    });
    return NextResponse.json(populated);
  } catch (err) {
    if (err instanceof CashfreeApiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Failed to check payment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
