import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import WalletTransaction from "@/models/WalletTransaction";
import { getCustomerSession } from "@/lib/customerAuth";
import { walletTopupSchema } from "@/lib/validation";
import { CashfreeApiError, createPaymentLink, getPaymentLinkStatus } from "@/lib/cashfree/client";
import { checkRateLimit } from "@/lib/rateLimit";

// Link ids are capped and can't contain most punctuation — see Cashfree's link_id constraints.
const WALLET_TOPUP_PREFIX = "WALLETTOPUP-";

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`wallet-topup:${session.customerId}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = walletTopupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const customer = await Customer.findById(session.customerId);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transaction = await WalletTransaction.create({
    customer: customer._id,
    type: "topup",
    direction: "credit",
    amount: parsed.data.amount,
    status: "pending",
  });

  const linkId = `${WALLET_TOPUP_PREFIX}${transaction._id}`;
  const notifyUrl = new URL("/api/webhooks/cashfree", req.nextUrl.origin).toString();

  try {
    let link;
    try {
      link = await createPaymentLink({
        linkId,
        amount: parsed.data.amount,
        currency: "INR",
        purpose: "Rana Forwarder wallet top-up",
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        notifyUrl,
      });
    } catch (err) {
      if (err instanceof CashfreeApiError) {
        link = await getPaymentLinkStatus(linkId);
      } else {
        throw err;
      }
    }

    transaction.cashfreeLinkId = link.linkId;
    await transaction.save();

    return NextResponse.json({ linkUrl: link.linkUrl, transactionId: transaction._id });
  } catch (err) {
    transaction.status = "failed";
    await transaction.save();
    if (err instanceof CashfreeApiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Failed to start top-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
