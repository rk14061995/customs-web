import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import DocumentRequest, { type IDocumentRequestItem } from "@/models/DocumentRequest";
import DocumentUpload from "@/models/DocumentUpload";
import { DocumentFileError, readUploadedFile } from "@/lib/documentFiles";
import { getAttachedItems } from "@/lib/documentRequests";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; templateId: string }> }
) {
  await dbConnect();
  const { token, templateId } = await params;

  const agreement = await Agreement.findOne({ token });
  if (!agreement) return NextResponse.json({ error: "This link could not be found." }, { status: 404 });

  const docRequest = await DocumentRequest.findOne({ shipment: agreement.shipment });
  if (!docRequest) return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });

  const attachedIds = new Set(getAttachedItems(docRequest).map((i: IDocumentRequestItem) => String(i.template)));
  if (!attachedIds.has(templateId)) {
    return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });
  }
  const item = docRequest.items.find((i: IDocumentRequestItem) => String(i.template) === templateId);
  if (!item) return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });

  try {
    const formData = await req.formData();
    const { fileName, mimeType, fileSize, fileData } = await readUploadedFile(formData, "file");

    const previousUploadId = item.upload;
    const upload = await DocumentUpload.create({ fileName, mimeType, fileSize, fileData });
    item.status = "uploaded";
    item.upload = upload._id;
    await docRequest.save();
    if (previousUploadId) await DocumentUpload.findByIdAndDelete(previousUploadId);

    return NextResponse.json({ success: true, fileName, uploadedAt: upload.uploadedAt });
  } catch (err) {
    if (err instanceof DocumentFileError) return NextResponse.json({ error: err.message }, { status: 400 });
    const message = err instanceof Error ? err.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
