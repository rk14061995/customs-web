import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { ensureQuotationShareToken } from "@/lib/quotationEmail";

/** Returns the token for this quotation's public PDF link (e.g. for sharing over WhatsApp), creating it on first request. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const token = await ensureQuotationShareToken(id);
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ token });
}
