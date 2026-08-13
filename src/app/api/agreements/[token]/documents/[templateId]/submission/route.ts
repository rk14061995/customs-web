import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import DocumentRequest, { type IDocumentRequestItem } from "@/models/DocumentRequest";
import DocumentUpload from "@/models/DocumentUpload";
import { fileResponse } from "@/lib/documentFiles";
import { getAttachedItems } from "@/lib/documentRequests";

/** Lets the customer download their own submitted/uploaded copy back — as opposed to /download, which serves the blank template. */
export async function GET(
  _req: Request,
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
  if (!item?.upload) return NextResponse.json({ error: "Nothing has been submitted for this document yet." }, { status: 404 });

  const upload = await DocumentUpload.findById(item.upload);
  if (!upload) return NextResponse.json({ error: "Submitted file not found" }, { status: 404 });

  return fileResponse(upload.fileData, upload.mimeType, upload.fileName);
}
