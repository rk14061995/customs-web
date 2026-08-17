import { NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bill from "@/models/Bill";
import { getCustomerSession } from "@/lib/customerAuth";
import { debitWalletForRelatedDoc } from "@/lib/wallet";
import { renderEnquiryEmailHtml, sendEnquiryEmail } from "@/lib/mail";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const bill = await Bill.findOne({ _id: id, customer: session.customerId });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (bill.status === "paid") {
    return NextResponse.json({ error: "This bill has already been paid." }, { status: 409 });
  }
  if (bill.status === "cancelled") {
    return NextResponse.json({ error: "This bill was cancelled." }, { status: 409 });
  }

  const result = await debitWalletForRelatedDoc({
    customerId: session.customerId,
    amount: bill.total,
    relatedField: "relatedBill",
    relatedId: bill._id.toString(),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  bill.status = "paid";
  await bill.save();

  // Same reasoning as the shipment-payment wallet route — this settles instantly with no
  // Cashfree link/webhook, so the admin needs an explicit nudge that money moved.
  after(async () => {
    try {
      await sendEnquiryEmail({
        subject: `Wallet Payment Received — Bill ${bill.billNumber}`,
        html: renderEnquiryEmailHtml("Bill Paid From Customer Wallet", {
          Customer: session.name,
          Email: session.email,
          "Bill Number": bill.billNumber,
          Amount: `${bill.currency} ${bill.total.toLocaleString("en-IN")}`,
        }),
      });
    } catch (err) {
      console.error("Failed to send wallet payment notification email:", err);
    }
  });

  return NextResponse.json({ success: true, balanceAfter: result.balanceAfter });
}
