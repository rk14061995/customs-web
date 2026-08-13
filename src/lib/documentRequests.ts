import dbConnect from "@/lib/dbConnect";
import Shipment from "@/models/Shipment";
import DocumentTemplate from "@/models/DocumentTemplate";
import DocumentRequest, { type IDocumentRequest, type IDocumentRequestItem } from "@/models/DocumentRequest";

/**
 * Creates (or refreshes) the DocumentRequest for a shipment — safe to call repeatedly, same
 * pattern as ensureAgreement. Every DocumentTemplate that doesn't already have a tracked item
 * gets one added as "pending", so newly uploaded templates automatically show up on existing
 * shipments too (attachment is opt-out via `excludedTemplates`, not opt-in).
 */
export async function ensureDocumentRequest(shipmentId: string): Promise<IDocumentRequest> {
  await dbConnect();

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error("Shipment not found");

  const templates = await DocumentTemplate.find().select("_id");
  const existing = await DocumentRequest.findOne({ shipment: shipment._id });
  const knownTemplateIds = new Set((existing?.items ?? []).map((i: IDocumentRequestItem) => String(i.template)));

  const newItems: IDocumentRequestItem[] = templates
    .filter((t) => !knownTemplateIds.has(String(t._id)))
    .map((t) => ({ template: t._id, status: "pending" as const }));

  const update: Record<string, unknown> = { $set: { customer: shipment.customer } };
  if (newItems.length) update.$push = { items: { $each: newItems } };

  const doc = await DocumentRequest.findOneAndUpdate({ shipment: shipment._id }, update, {
    upsert: true,
    new: true,
    runValidators: true,
  });
  if (!doc) throw new Error("Failed to save document request");
  return doc;
}

/** Admin's explicit opt-out — which templates should NOT be attached to this shipment. */
export async function setExcludedTemplates(shipmentId: string, excludedTemplateIds: string[]): Promise<IDocumentRequest> {
  await ensureDocumentRequest(shipmentId);
  const doc = await DocumentRequest.findOneAndUpdate(
    { shipment: shipmentId },
    { $set: { excludedTemplates: excludedTemplateIds } },
    { new: true, runValidators: true }
  );
  if (!doc) throw new Error("Document request not found");
  return doc;
}

/** The items actually attached to a shipment — everything except what's been explicitly excluded. */
export function getAttachedItems(doc: IDocumentRequest): IDocumentRequestItem[] {
  const excluded = new Set(doc.excludedTemplates.map((id) => String(id)));
  return doc.items.filter((item) => !excluded.has(String(item.template)));
}
