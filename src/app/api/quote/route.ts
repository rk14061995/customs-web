import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/Quote";
import { quoteSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const quote = await Quote.create(parsed.data);

  return NextResponse.json({ success: true, id: quote._id }, { status: 201 });
}
