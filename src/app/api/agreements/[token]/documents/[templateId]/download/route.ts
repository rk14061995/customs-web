import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import DocumentRequest, { type IDocumentRequestItem } from "@/models/DocumentRequest";
import DocumentTemplate from "@/models/DocumentTemplate";
import { fileResponse } from "@/lib/documentFiles";
import { getAttachedItems } from "@/lib/documentRequests";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string; templateId: string }> }
) {
  await dbConnect();
  const { token, templateId } = await params;

  const agreement = await Agreement.findOne({ token });
  if (!agreement) return NextResponse.json({ error: "This link could not be found." }, { status: 404 });

  const docRequest = await DocumentRequest.findOne({ shipment: agreement.shipment });
  const attached = docRequest
    ? getAttachedItems(docRequest).some((i: IDocumentRequestItem) => String(i.template) === templateId)
    : false;
  if (!attached) return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });

  const template = await DocumentTemplate.findById(templateId);
  if (!template) return NextResponse.json({ error: "Document template not found" }, { status: 404 });

  return fileResponse(template.fileData, template.mimeType, template.fileName);
}
