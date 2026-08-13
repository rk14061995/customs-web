import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import DocumentRequest, { type IDocumentRequestItem } from "@/models/DocumentRequest";
import DocumentUpload from "@/models/DocumentUpload";
import { fileResponse } from "@/lib/documentFiles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shipmentId: string; templateId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { shipmentId, templateId } = await params;

  const request = await DocumentRequest.findOne({ shipment: shipmentId });
  if (!request) return NextResponse.json({ error: "Document request not found" }, { status: 404 });

  const item = request.items.find((i: IDocumentRequestItem) => String(i.template) === templateId);
  if (!item?.upload) return NextResponse.json({ error: "Nothing has been uploaded for this document yet" }, { status: 404 });

  const upload = await DocumentUpload.findById(item.upload);
  if (!upload) return NextResponse.json({ error: "Uploaded file not found" }, { status: 404 });

  return fileResponse(upload.fileData, upload.mimeType, upload.fileName);
}
