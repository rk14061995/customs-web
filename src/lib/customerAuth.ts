import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "customer_token";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export type CustomerSession = {
  kind: "customer";
  customerId: string;
  email: string;
  name: string;
};

export function signCustomerSession(session: Omit<CustomerSession, "kind">) {
  const payload: CustomerSession = { ...session, kind: "customer" };
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "30d" });
}

export function verifyCustomerSession(token: string): CustomerSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as CustomerSession;
    // The same JWT_SECRET signs admin sessions too — the `kind` discriminator
    // stops an admin_token from being replayed here (and vice versa in auth.ts).
    if (decoded.kind !== "customer") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerSession(token);
}

export const CUSTOMER_AUTH_COOKIE_NAME = COOKIE_NAME;
