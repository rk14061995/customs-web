import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Agreement from "@/models/Agreement";
import DocumentRequest from "@/models/DocumentRequest";
import DocumentTemplate from "@/models/DocumentTemplate";
import DocumentUpload from "@/models/DocumentUpload";
import "@/models/Shipment";
import "@/models/Customer";
import { getAttachedItems } from "@/lib/documentRequests";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  await dbConnect();
  const { token } = await params;

  const agreement = await Agreement.findOne({ token })
    .populate("shipment", "trackingNumber carrierTrackingNumber origin destination")
    .populate("customer", "name company email phone address gstNumber");

  if (!agreement) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });

  if (agreement.status === "pending" && agreement.expiresAt < new Date()) {
    return NextResponse.json({ error: "This signing link has expired" }, { status: 410 });
  }

  // All document templates attached to this same shipment — shared on this one link rather than
  // a separate document-request link. See ensureDocumentRequest / getAttachedItems.
  const shipmentId = agreement.shipment ? (agreement.shipment as unknown as { _id: string })._id : null;
  const docRequest = shipmentId ? await DocumentRequest.findOne({ shipment: shipmentId }) : null;
  const attachedItems = docRequest ? getAttachedItems(docRequest) : [];

  const templates = await DocumentTemplate.find({ _id: { $in: attachedItems.map((i) => i.template) } }).select(
    "title category fileName fields"
  );
  const templateById = new Map(templates.map((t) => [String(t._id), t]));

  const uploadIds = attachedItems.map((i) => i.upload).filter(Boolean);
  const uploads = uploadIds.length
    ? await DocumentUpload.find({ _id: { $in: uploadIds } }).select("fileName uploadedAt")
    : [];
  const uploadById = new Map(uploads.map((u) => [String(u._id), u]));

  const documents = attachedItems
    .map((item) => {
      const template = templateById.get(String(item.template));
      if (!template) return null;
      return {
        template: {
          _id: template._id,
          title: template.title,
          category: template.category,
          fileName: template.fileName,
          fields: template.fields,
        },
        status: item.status,
        upload: item.upload ? uploadById.get(String(item.upload)) ?? null : null,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const payload = agreement.toObject();
  return NextResponse.json({ ...payload, documents });
}
