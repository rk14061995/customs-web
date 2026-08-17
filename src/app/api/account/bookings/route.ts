import { NextRequest, NextResponse, after } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import Quote from "@/models/Quote";
import { getCustomerSession } from "@/lib/customerAuth";
import { bookingRequestSchema } from "@/lib/validation";
import { renderEnquiryEmailHtml, sendEnquiryEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const bookings = await Quote.find({ customer: session.customerId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`account-booking:${session.customerId}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const customer = await Customer.findById(session.customerId);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quote = await Quote.create({
    ...parsed.data,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    customer: customer._id,
  });

  // Same best-effort, non-blocking notification pattern as the public quote form.
  after(async () => {
    try {
      await sendEnquiryEmail({
        subject: `New Shipment Request (registered customer) — ${customer.name}`,
        html: renderEnquiryEmailHtml("New “Pay for Shipment” Request from Customer Dashboard", {
          Name: customer.name,
          Company: customer.company,
          Phone: customer.phone,
          Email: customer.email,
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
      console.error("Failed to send booking request email:", err);
    }
  });

  return NextResponse.json({ success: true, id: quote._id }, { status: 201 });
}
