import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import { customerLoginSchema } from "@/lib/validation";
import { signCustomerSession, CUSTOMER_AUTH_COOKIE_NAME } from "@/lib/customerAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`account-login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  await dbConnect();
  const customer = await Customer.findOne({ email: parsed.data.email.toLowerCase() }).select(
    "+passwordHash"
  );
  if (!customer || !customer.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, customer.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = signCustomerSession({
    customerId: customer._id.toString(),
    email: customer.email,
    name: customer.name,
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set(CUSTOMER_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
