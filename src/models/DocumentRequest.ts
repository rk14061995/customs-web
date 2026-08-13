import { Schema, model, models, Types, type Document } from "mongoose";

export const DOCUMENT_ITEM_STATUSES = ["pending", "uploaded"] as const;

export interface IDocumentRequestItem {
  template: Types.ObjectId;
  status: (typeof DOCUMENT_ITEM_STATUSES)[number];
  upload?: Types.ObjectId;
}

/**
 * Tracks which DocumentTemplates apply to a shipment and each one's upload status. Every
 * DocumentTemplate is attached by default — `excludedTemplates` is the admin's explicit opt-out
 * list, not an opt-in one, so newly uploaded templates show up on existing shipments too unless
 * deselected. One per shipment (unique), shared with the customer via the Agreement signing link
 * (`/agreements/sign/[token]`) rather than a link of its own — see ensureDocumentRequest.
 */
export interface IDocumentRequest extends Document {
  shipment: Types.ObjectId;
  customer: Types.ObjectId;
  items: IDocumentRequestItem[];
  excludedTemplates: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRequestItemSchema = new Schema<IDocumentRequestItem>(
  {
    template: { type: Schema.Types.ObjectId, ref: "DocumentTemplate", required: true },
    status: { type: String, enum: DOCUMENT_ITEM_STATUSES, default: "pending" },
    upload: { type: Schema.Types.ObjectId, ref: "DocumentUpload" },
  },
  { _id: false }
);

const DocumentRequestSchema = new Schema<IDocumentRequest>(
  {
    shipment: { type: Schema.Types.ObjectId, ref: "Shipment", required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    items: { type: [DocumentRequestItemSchema], default: [] },
    excludedTemplates: { type: [Schema.Types.ObjectId], ref: "DocumentTemplate", default: [] },
  },
  { timestamps: true }
);

export default models.DocumentRequest || model<IDocumentRequest>("DocumentRequest", DocumentRequestSchema);
