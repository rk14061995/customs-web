import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import AgreementTemplate from "@/models/AgreementTemplate";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  let doc = await AgreementTemplate.findOne();
  if (!doc) doc = await AgreementTemplate.create({});
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const body = await req.json();
  const doc = await AgreementTemplate.findOneAndUpdate(
    {},
    { $set: body },
    { new: true, upsert: true, runValidators: true }
  );
  return NextResponse.json(doc);
}
