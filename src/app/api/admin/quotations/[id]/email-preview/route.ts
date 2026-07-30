import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { buildQuotationEmail } from "@/lib/quotationEmail";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await buildQuotationEmail(id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ to: result.to, subject: result.subject, html: result.html });
}
