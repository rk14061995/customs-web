import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Testimonial from "@/models/Testimonial";
import { reviewSchema } from "@/lib/validation";
import { renderEnquiryEmailHtml, sendEnquiryEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate-limited per IP since this is an unauthenticated, publicly writable endpoint.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`public-review:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many review submissions. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();

  const { name, email, company, rating, quote } = parsed.data;
  const testimonial = await Testimonial.create({
    name,
    email,
    company,
    rating,
    quote,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    // Customer-submitted reviews are never auto-published — an admin has to
    // approve them from the admin panel before they appear on the site.
    published: false,
    source: "customer",
  });

  try {
    await sendEnquiryEmail({
      subject: `New Review Submitted — ${rating}★ from ${name}`,
      html: renderEnquiryEmailHtml("New Customer Review (pending approval)", {
        Name: name,
        Email: email,
        Company: company,
        Rating: `${rating} / 5`,
        Review: quote,
      }),
    });
  } catch (err) {
    console.error("Failed to send review notification email:", err);
  }

  return NextResponse.json({ success: true, id: testimonial._id }, { status: 201 });
}
