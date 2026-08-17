import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "admin_token";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export type AdminSession = {
  kind: "admin";
  userId: string;
  email: string;
  name: string;
  role: string;
};

export function signSession(session: Omit<AdminSession, "kind">) {
  const payload: AdminSession = { ...session, kind: "admin" };
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "7d" });
}

export function verifySession(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as AdminSession;
    // JWT_SECRET is shared with customer sessions (src/lib/customerAuth.ts) — the
    // `kind` discriminator stops a customer_token from being replayed here under
    // a renamed cookie (and vice versa).
    if (decoded.kind !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

// Dev-only escape hatch for working locally when the database is unreachable
// (e.g. flaky Atlas connectivity). Requires an explicit opt-in env var AND
// NODE_ENV !== "production" — Vercel always sets NODE_ENV=production in
// deployed environments, so this cannot accidentally activate there even if
// DEV_SKIP_AUTH is left set somewhere.
export function isDevAuthBypassEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEV_SKIP_AUTH === "true";
}

const DEV_BYPASS_SESSION: AdminSession = {
  kind: "admin",
  userId: "dev-bypass",
  email: "dev@local",
  name: "Dev (auth bypassed)",
  role: "admin",
};

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isDevAuthBypassEnabled()) return DEV_BYPASS_SESSION;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
