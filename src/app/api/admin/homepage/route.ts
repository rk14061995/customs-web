import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Homepage from "@/models/Homepage";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const doc = await Homepage.findOne().lean();
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const body = await req.json();
  const doc = await Homepage.findOneAndUpdate({}, body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  return NextResponse.json(doc);
}
