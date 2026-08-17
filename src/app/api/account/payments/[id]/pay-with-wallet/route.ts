import { NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";
import Shipment from "@/models/Shipment";
import { getCustomerSession } from "@/lib/customerAuth";
import { debitWalletForRelatedDoc } from "@/lib/wallet";
import { recomputeShipmentPaymentStatus } from "@/lib/shipmentUtils";
import { renderEnquiryEmailHtml, sendEnquiryEmail } from "@/lib/mail";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const payment = await Payment.findById(id);
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shipment = await Shipment.findById(payment.shipment);
  if (!shipment || shipment.customer.toString() !== session.customerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (payment.status === "paid") {
    return NextResponse.json({ error: "This payment has already been paid." }, { status: 409 });
  }

  const result = await debitWalletForRelatedDoc({
    customerId: session.customerId,
    amount: payment.amount,
    relatedField: "relatedPayment",
    relatedId: payment._id.toString(),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  payment.status = "paid";
  payment.method = "Wallet";
  payment.paidAt = new Date().toISOString().slice(0, 10);
  await payment.save();

  await recomputeShipmentPaymentStatus(shipment._id.toString());

  // Wallet payments settle instantly with no Cashfree link/webhook the admin would otherwise
  // notice — tell them directly that money moved and the shipment can be picked up/processed.
  after(async () => {
    try {
      await sendEnquiryEmail({
        subject: `Wallet Payment Received — ${payment.invoiceNumber} (${shipment.trackingNumber})`,
        html: renderEnquiryEmailHtml("Shipment Paid From Customer Wallet", {
          Customer: session.name,
          Email: session.email,
          "Invoice Number": payment.invoiceNumber,
          Amount: `${payment.currency} ${payment.amount.toLocaleString("en-IN")}`,
          "Tracking Number": shipment.trackingNumber,
          Route: `${shipment.origin} → ${shipment.destination}`,
        }),
      });
    } catch (err) {
      console.error("Failed to send wallet payment notification email:", err);
    }
  });

  return NextResponse.json({ success: true, balanceAfter: result.balanceAfter });
}
