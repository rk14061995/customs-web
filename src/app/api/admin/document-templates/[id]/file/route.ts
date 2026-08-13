import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import DocumentTemplate from "@/models/DocumentTemplate";
import { fileResponse } from "@/lib/documentFiles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const doc = await DocumentTemplate.findById(id);
  if (!doc) return NextResponse.json({ error: "Document template not found" }, { status: 404 });

  return fileResponse(doc.fileData, doc.mimeType, doc.fileName);
}
