import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";
import Customer from "@/models/Customer";
import WalletTransaction from "@/models/WalletTransaction";
import { recomputeShipmentPaymentStatus } from "@/lib/shipmentUtils";

const WALLET_TOPUP_PREFIX = "WALLETTOPUP-";

// Cashfree signs webhooks as base64(HMAC-SHA256(timestamp + rawBody, secret)),
// sent as `x-webhook-signature` / `x-webhook-timestamp` headers. Verify against
// the raw body — never against a re-serialized/parsed version of it.
// Docs: https://www.cashfree.com/docs/payments/online/webhooks
function isValidSignature(rawBody: string, timestamp: string, signature: string) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp || !isValidSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  // Payload shape per Cashfree's Payment Links webhook — confirm exact field
  // names against the live dashboard payload viewer before going to production.
  const linkId: string | undefined = event?.data?.link_id ?? event?.data?.link?.link_id;
  const linkStatus: string | undefined = event?.data?.link_status ?? event?.data?.link?.link_status;

  if (!linkId) {
    return NextResponse.json({ error: "Missing link_id in webhook payload" }, { status: 400 });
  }

  await dbConnect();

  if (linkId.startsWith(WALLET_TOPUP_PREFIX)) {
    const transaction = await WalletTransaction.findOne({ cashfreeLinkId: linkId });
    if (!transaction) {
      // Nothing to reconcile against — acknowledge so Cashfree doesn't retry.
      return NextResponse.json({ received: true });
    }
    // Idempotent: a retried/duplicate webhook delivery must not credit the wallet twice.
    if (transaction.status === "completed") {
      return NextResponse.json({ received: true });
    }

    if (linkStatus === "PAID") {
      const updatedCustomer = await Customer.findByIdAndUpdate(
        transaction.customer,
        { $inc: { walletBalance: transaction.amount } },
        { new: true }
      );
      transaction.status = "completed";
      transaction.balanceAfter = updatedCustomer?.walletBalance;
      await transaction.save();
    } else if (linkStatus === "EXPIRED" || linkStatus === "CANCELLED") {
      transaction.status = "failed";
      await transaction.save();
    }

    return NextResponse.json({ received: true });
  }

  const payment = await Payment.findOne({ paymentLinkId: linkId });
  if (!payment) {
    // Nothing to reconcile against — acknowledge so Cashfree doesn't retry.
    return NextResponse.json({ received: true });
  }

  if (payment.status === "paid") {
    return NextResponse.json({ received: true });
  }

  if (linkStatus) payment.paymentLinkStatus = linkStatus;
  if (linkStatus === "PAID") {
    payment.status = "paid";
    payment.paidAt = new Date().toISOString().slice(0, 10);
  }
  await payment.save();

  if (payment.status === "paid") {
    await recomputeShipmentPaymentStatus(payment.shipment.toString());
  }

  return NextResponse.json({ received: true });
}
