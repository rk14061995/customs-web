import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/Quote";
import { quoteSchema } from "@/lib/validation";
import { renderEnquiryEmailHtml, sendEnquiryEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const quote = await Quote.create(parsed.data);

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

  return NextResponse.json({ success: true, id: quote._id }, { status: 201 });
}
