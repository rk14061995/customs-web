import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import DocumentRequest, { type IDocumentRequestItem } from "@/models/DocumentRequest";
import DocumentUpload from "@/models/DocumentUpload";

/** Metadata + the raw submitted answers (if it was filled online) for the admin "view" modal — no file bytes, see the sibling /file route for the download itself. */
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

  const upload = await DocumentUpload.findById(item.upload).select("fileName mimeType fileSize answers uploadedAt");
  if (!upload) return NextResponse.json({ error: "Uploaded file not found" }, { status: 404 });

  return NextResponse.json({
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    fileSize: upload.fileSize,
    answers: upload.answers ?? null,
    uploadedAt: upload.uploadedAt,
  });
}

/** Resets a single document back to "pending" — deletes its uploaded/submitted file. Used to clear test/mistaken submissions without touching the rest of the shipment's documents. */
export async function DELETE(
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
  if (!item) return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });

  const previousUploadId = item.upload;
  item.status = "pending";
  item.upload = undefined;
  await request.save();
  if (previousUploadId) await DocumentUpload.findByIdAndDelete(previousUploadId);

  return NextResponse.json({ success: true });
}
