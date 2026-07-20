import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Settings from "@/models/Settings";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const doc = await Settings.findOne().lean();
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const body = await req.json();
  const doc = await Settings.findOneAndUpdate({}, body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  return NextResponse.json(doc);
}
