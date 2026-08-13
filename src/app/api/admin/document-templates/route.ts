import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import DocumentTemplate from "@/models/DocumentTemplate";
import { DocumentFieldsError, DocumentFileError, parseTemplateFields, readUploadedFile } from "@/lib/documentFiles";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const docs = await DocumentTemplate.find().sort({ createdAt: -1 }).select("-fileData").lean();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const formData = await req.formData();
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    const { fileName, mimeType, fileSize, fileData } = await readUploadedFile(formData, "file");

    const fieldsRaw = formData.get("fields");
    const fields = parseTemplateFields(fieldsRaw ? JSON.parse(String(fieldsRaw)) : undefined);

    const doc = await DocumentTemplate.create({ title, category, fileName, mimeType, fileSize, fileData, fields });
    return NextResponse.json(
      {
        _id: doc._id,
        title: doc.title,
        category: doc.category,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        fields: doc.fields,
        createdAt: doc.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof DocumentFieldsError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof DocumentFileError) return NextResponse.json({ error: err.message }, { status: 400 });
    const message = err instanceof Error ? err.message : "Failed to upload document template";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
