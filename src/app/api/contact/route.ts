import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Contact from "@/models/Contact";
import { contactSchema } from "@/lib/validation";
import { renderEnquiryEmailHtml, sendEnquiryEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const contact = await Contact.create(parsed.data);

  try {
    await sendEnquiryEmail({
      subject: `New Contact Enquiry — ${parsed.data.subject}`,
      html: renderEnquiryEmailHtml("New Contact Enquiry", {
        Name: parsed.data.name,
        Email: parsed.data.email,
        Phone: parsed.data.phone,
        Subject: parsed.data.subject,
        Message: parsed.data.message,
      }),
    });
  } catch (err) {
    console.error("Failed to send contact enquiry email:", err);
  }

  return NextResponse.json({ success: true, id: contact._id }, { status: 201 });
}
