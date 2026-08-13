import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import DocumentTemplate from "@/models/DocumentTemplate";
import { DocumentFieldsError, parseTemplateFields } from "@/lib/documentFiles";

/** Updates title/category/fields — not the file itself; re-upload a new template to change that. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.category === "string" && body.category.trim()) update.category = body.category.trim();

  try {
    if (body.fields !== undefined) update.fields = parseTemplateFields(body.fields);
  } catch (err) {
    if (err instanceof DocumentFieldsError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const doc = await DocumentTemplate.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).select(
    "-fileData"
  );
  if (!doc) return NextResponse.json({ error: "Document template not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  await DocumentTemplate.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
