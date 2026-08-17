import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import { customerSignupSchema } from "@/lib/validation";
import { signCustomerSession, CUSTOMER_AUTH_COOKIE_NAME } from "@/lib/customerAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate-limited per IP — unauthenticated, publicly writable, and creates DB records.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`account-signup:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = customerSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const { name, company, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await Customer.findOne({ email: normalizedEmail }).select("+passwordHash");

  let customer;
  if (existing) {
    // An admin-created record with the same email but no portal access yet — claim it
    // rather than erroring, so an existing customer can self-serve into their own history.
    if (existing.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in instead." },
        { status: 409 }
      );
    }
    existing.passwordHash = await bcrypt.hash(password, 12);
    // Fill in anything the admin-created record was missing, without clobbering existing data.
    existing.name = existing.name || name;
    existing.company = existing.company || company;
    existing.phone = existing.phone || phone;
    customer = await existing.save();
  } else {
    customer = await Customer.create({
      name,
      company,
      email: normalizedEmail,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      walletBalance: 0,
    });
  }

  const token = signCustomerSession({
    customerId: customer._id.toString(),
    email: customer.email,
    name: customer.name,
  });

  const res = NextResponse.json({ success: true }, { status: 201 });
  res.cookies.set(CUSTOMER_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
