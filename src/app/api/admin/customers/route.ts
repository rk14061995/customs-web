import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import { getAdminSession } from "@/lib/auth";
import { createListHandlers } from "@/lib/adminApi";

// Custom GET (POST still comes from the generic factory) — passwordHash is `select: false` on
// the model, so it has to be explicitly selected here to compute `hasPortalAccess`. It's stripped
// back out before the response goes out; only the derived boolean is ever sent to the client.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const docs = await Customer.find().select("+passwordHash").sort({ createdAt: -1 }).lean();
  const withPortalFlag = docs.map(({ passwordHash, ...doc }) => ({
    ...doc,
    hasPortalAccess: Boolean(passwordHash),
  }));
  return NextResponse.json(withPortalFlag);
}

export const { POST } = createListHandlers(Customer, { createdAt: -1 });
