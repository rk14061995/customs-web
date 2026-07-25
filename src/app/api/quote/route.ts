import { NextRequest, NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/Quote";
import { quoteSchema } from "@/lib/validation";
import {
  renderEnquiryEmailHtml,
  renderQuoteConfirmationEmailHtml,
  sendCustomerConfirmationEmail,
  sendEnquiryEmail,
} from "@/lib/mail";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const quote = await Quote.create(parsed.data);

  // Emails are best-effort notifications, not required for the request to
  // succeed — the quote is already saved. Send them after the response goes
  // out so slow SMTP handshakes don't hold up the client.
  after(async () => {
    try {
      await sendEnquiryEmail({
        subject: `New Quote Request — ${parsed.data.name}`,
        html: renderEnquiryEmailHtml("New Quote Request", {
          Name: parsed.data.name,
          Company: parsed.data.company,
          Phone: parsed.data.phone,
          Email: parsed.data.email,
          "Pickup Location": parsed.data.pickupLocation,
          Destination: parsed.data.destination,
          "Shipment Type": parsed.data.shipmentType,
          Weight: parsed.data.weight,
          Dimensions: parsed.data.dimensions,
          "Expected Pickup Date": parsed.data.pickupDate,
          Message: parsed.data.message,
        }),
      });
    } catch (err) {
      console.error("Failed to send quote request email:", err);
    }

    try {
      await sendCustomerConfirmationEmail({
        to: parsed.data.email,
        subject: "We've received your quote request — Rana Forwarder",
        html: renderQuoteConfirmationEmailHtml(parsed.data.name, {
          "Pickup Location": parsed.data.pickupLocation,
          Destination: parsed.data.destination,
          "Shipment Type": parsed.data.shipmentType,
          Weight: parsed.data.weight,
          Dimensions: parsed.data.dimensions,
          "Expected Pickup Date": parsed.data.pickupDate,
        }),
      });
    } catch (err) {
      console.error("Failed to send customer confirmation email:", err);
    }
  });

  return NextResponse.json({ success: true, id: quote._id }, { status: 201 });
}
