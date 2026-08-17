import { NextResponse } from "next/server";
import { CUSTOMER_AUTH_COOKIE_NAME } from "@/lib/customerAuth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(CUSTOMER_AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
