import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import DocumentRequest, { type IDocumentRequestItem } from "@/models/DocumentRequest";
import DocumentTemplate from "@/models/DocumentTemplate";
import DocumentUpload from "@/models/DocumentUpload";
import { getAttachedItems } from "@/lib/documentRequests";
import { generateFilledFormPdf } from "@/lib/documentFormPdf";
import { getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; templateId: string }> }
) {
  await dbConnect();
  const { token, templateId } = await params;

  const agreement = await Agreement.findOne({ token }).populate("customer", "name");
  if (!agreement) return NextResponse.json({ error: "This link could not be found." }, { status: 404 });

  const docRequest = await DocumentRequest.findOne({ shipment: agreement.shipment });
  if (!docRequest) return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });

  const attachedIds = new Set(getAttachedItems(docRequest).map((i: IDocumentRequestItem) => String(i.template)));
  if (!attachedIds.has(templateId)) {
    return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });
  }
  const item = docRequest.items.find((i: IDocumentRequestItem) => String(i.template) === templateId);
  if (!item) return NextResponse.json({ error: "This document isn't part of this request." }, { status: 404 });

  const template = await DocumentTemplate.findById(templateId);
  if (!template) return NextResponse.json({ error: "Document template not found" }, { status: 404 });
  if (!template.fields.length) {
    return NextResponse.json({ error: "This document doesn't support filling online — upload a file instead." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const answers: Record<string, string> = {};
  for (const field of template.fields) {
    const raw = body?.answers?.[field.key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !value) {
      return NextResponse.json({ error: `"${field.label}" is required.` }, { status: 400 });
    }
    if (value) answers[field.key] = value;
  }

  const settings = await getSettings();
  const resolved = settings ?? siteConfig;
  const companyName = "siteName" in resolved ? resolved.siteName : resolved.name;
  const companyPhone = "alternatePhone" in resolved && resolved.alternatePhone ? `${resolved.phone} / ${resolved.alternatePhone}` : resolved.phone;

  const submittedAt = new Date();
  const pdf = await generateFilledFormPdf({
    title: template.title,
    companyName,
    companyAddress: resolved.address,
    companyPhone,
    fields: template.fields,
    answers,
    submittedByName: agreement.customer?.name,
    submittedAt,
  });

  const previousUploadId = item.upload;
  const upload = await DocumentUpload.create({
    fileName: `${template.title}.pdf`,
    mimeType: "application/pdf",
    fileSize: pdf.length,
    fileData: pdf,
    answers,
    uploadedAt: submittedAt,
  });
  item.status = "uploaded";
  item.upload = upload._id;
  await docRequest.save();
  if (previousUploadId) await DocumentUpload.findByIdAndDelete(previousUploadId);

  return NextResponse.json({ success: true, fileName: upload.fileName, uploadedAt: upload.uploadedAt });
}
