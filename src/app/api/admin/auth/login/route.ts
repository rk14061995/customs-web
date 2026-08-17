import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { signSession, AUTH_COOKIE_NAME, isDevAuthBypassEnabled, type AdminSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

function issueSessionResponse(session: Omit<AdminSession, "kind">) {
  const token = signSession(session);
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  if (isDevAuthBypassEnabled()) {
    return issueSessionResponse({
      userId: "dev-bypass",
      email: parsed.data.email,
      name: "Dev (auth bypassed)",
      role: "admin",
    });
  }

  // Static credentials, checked first — independent of database availability.
  // Lets the admin always log in (e.g. during a MongoDB outage) as long as
  // STATIC_ADMIN_EMAIL/STATIC_ADMIN_PASSWORD_HASH are configured. Any other
  // email falls through to the DB-backed user lookup below.
  const staticEmail = process.env.STATIC_ADMIN_EMAIL;
  const staticHash = process.env.STATIC_ADMIN_PASSWORD_HASH;
  if (staticEmail && staticHash && parsed.data.email.toLowerCase() === staticEmail.toLowerCase()) {
    const valid = await bcrypt.compare(parsed.data.password, staticHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    return issueSessionResponse({
      userId: "static-admin",
      email: staticEmail,
      name: "Admin",
      role: "admin",
    });
  }

  await dbConnect();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  return issueSessionResponse({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
