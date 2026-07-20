import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "admin_token";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export type AdminSession = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

export function signSession(session: AdminSession) {
  return jwt.sign(session, JWT_SECRET as string, { expiresIn: "7d" });
}

export function verifySession(token: string): AdminSession | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
