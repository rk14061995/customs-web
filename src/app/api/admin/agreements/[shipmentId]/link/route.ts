import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { ensureAgreement } from "@/lib/agreements";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipmentId } = await params;

  try {
    const agreement = await ensureAgreement(shipmentId);
    const link = new URL(`/agreements/sign/${agreement.token}`, req.nextUrl.origin).toString();
    return NextResponse.json({ ...agreement.toObject(), link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate agreement link";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
