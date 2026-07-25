import { NextRequest, NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import Payment from "@/models/Payment";
import "@/models/Shipment";
import "@/models/Customer";
import type { IShipment } from "@/models/Shipment";
import type { ICustomer } from "@/models/Customer";
import { CashfreeApiError, createPaymentLink, getPaymentLinkStatus } from "@/lib/cashfree/client";
import { renderPaymentLinkEmailHtml, sendCustomerConfirmationEmail } from "@/lib/mail";

type PopulatedShipment = IShipment & { customer: ICustomer | null };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const payment = await Payment.findById(id).populate<{ shipment: PopulatedShipment | null }>({
    path: "shipment",
    populate: { path: "customer" },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (payment.status === "paid") {
    return NextResponse.json({ error: "This invoice is already paid." }, { status: 400 });
  }

  const customer = payment.shipment?.customer;
  if (!customer?.email) {
    return NextResponse.json(
      { error: "This shipment's customer has no email on file — add one before sending a payment link." },
      { status: 400 }
    );
  }

  const notifyUrl = new URL("/api/webhooks/cashfree", req.nextUrl.origin).toString();

  try {
    let link;
    try {
      link = await createPaymentLink({
        linkId: payment.invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        purpose: `Payment for invoice ${payment.invoiceNumber}`,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        notifyUrl,
      });
    } catch (err) {
      // The link may already exist from a previous "Send Payment Link" click
      // (linkId is stable, derived from invoiceNumber) — recover it instead
      // of failing outright.
      if (err instanceof CashfreeApiError) {
        link = await getPaymentLinkStatus(payment.invoiceNumber);
      } else {
        throw err;
      }
    }

    payment.paymentLinkId = link.linkId;
    payment.paymentLinkUrl = link.linkUrl;
    payment.paymentLinkStatus = link.status;
    await payment.save();

    after(async () => {
      try {
        await sendCustomerConfirmationEmail({
          to: customer.email,
          subject: `Payment request for invoice ${payment.invoiceNumber} — Rana Forwarder`,
          html: renderPaymentLinkEmailHtml(customer.name, {
            invoiceNumber: payment.invoiceNumber,
            amount: payment.amount,
            currency: payment.currency,
            link: link.linkUrl,
          }),
        });
      } catch (err) {
        console.error("Failed to send payment link email:", err);
      }
    });

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
    const message = err instanceof Error ? err.message : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
