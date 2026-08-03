import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  await dbConnect();
  const { token } = await params;
  const body = await req.json();

  const signedName = typeof body.signedName === "string" ? body.signedName.trim() : "";
  const signatureDataUrl = typeof body.signatureDataUrl === "string" ? body.signatureDataUrl : "";

  if (!signedName) {
    return NextResponse.json({ error: "Please enter your full name" }, { status: 400 });
  }
  if (!signatureDataUrl.startsWith("data:image/") || signatureDataUrl.length > 2_000_000) {
    return NextResponse.json({ error: "Please draw your signature" }, { status: 400 });
  }

  const agreement = await Agreement.findOne({ token });
  if (!agreement) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  if (agreement.status === "signed") {
    return NextResponse.json({ error: "This agreement has already been signed" }, { status: 409 });
  }
  if (agreement.expiresAt < new Date()) {
    return NextResponse.json({ error: "This signing link has expired" }, { status: 410 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

  agreement.status = "signed";
  agreement.signature = {
    signedName,
    signatureDataUrl,
    signedAt: new Date(),
    ip,
  };
  await agreement.save();

  return NextResponse.json({ status: agreement.status });
}
