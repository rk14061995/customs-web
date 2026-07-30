import { NextRequest, NextResponse } from "next/server";
import type { Model } from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import { renderAdminMessageEmailHtml, sendCustomerConfirmationEmail } from "@/lib/mail";

async function requireSession() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function createListHandlers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  sort: Record<string, 1 | -1> = {}
) {
  async function GET() {
    const unauthorized = await requireSession();
    if (unauthorized) return unauthorized;
    await dbConnect();
    const docs = await model.find().sort(sort).lean();
    return NextResponse.json(docs);
  }

  async function POST(req: NextRequest) {
    const unauthorized = await requireSession();
    if (unauthorized) return unauthorized;
    await dbConnect();
    const body = await req.json();
    try {
      const doc = await model.create(body);
      return NextResponse.json(doc, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create record";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return { GET, POST };
}

export function createItemHandlers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
) {
  async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const unauthorized = await requireSession();
    if (unauthorized) return unauthorized;
    await dbConnect();
    const { id } = await params;
    const doc = await model.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  }

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const unauthorized = await requireSession();
    if (unauthorized) return unauthorized;
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    try {
      const doc = await model.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(doc);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update record";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const unauthorized = await requireSession();
    if (unauthorized) return unauthorized;
    await dbConnect();
    const { id } = await params;
    await model.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  }

  return { GET, PUT, DELETE };
}

/** POST /.../[id]/send-email — sends an admin-composed message to the record's email field. */
export function createSendEmailHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  { emailField = "email", nameField = "name" }: { emailField?: string; nameField?: string } = {}
) {
  async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const unauthorized = await requireSession();
    if (unauthorized) return unauthorized;
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const doc = (await model.findById(id).lean()) as Record<string, unknown> | null;
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const to = doc[emailField];
    if (typeof to !== "string" || !to) {
      return NextResponse.json({ error: "This record has no email on file" }, { status: 400 });
    }

    try {
      await sendCustomerConfirmationEmail({
        to,
        subject,
        html: renderAdminMessageEmailHtml(String(doc[nameField] ?? ""), message),
      });
      return NextResponse.json({ success: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send email";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }

  return { POST };
}
