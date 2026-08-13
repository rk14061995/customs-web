import { Schema, model, models, type Document } from "mongoose";

export const DOCUMENT_FIELD_TYPES = ["text", "textarea", "date", "select"] as const;

export interface IDocumentTemplateField {
  key: string;
  label: string;
  type: (typeof DOCUMENT_FIELD_TYPES)[number];
  required: boolean;
  options?: string[];
}

/**
 * A blank form (Credit Approval Form, KYC Form, MSME Agreement, etc.) uploaded once by an
 * admin and reused across many shipments — see DocumentRequest, which maps a set of these to
 * a shipment/customer and hands the customer a link to download, fill, and send back.
 */
export interface IDocumentTemplate extends Document {
  title: string;
  /** Free text, not an enum — lets admins create arbitrary new form types beyond the initial set. */
  category: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
  /**
   * Optional field definitions — when present, the customer can fill this form directly on the
   * agreement page (see /api/agreements/[token]/documents/[templateId]/submit) instead of
   * downloading, printing, and uploading a scan. Downloading the original file and uploading a
   * scan/filled copy always remains available as a fallback regardless of this.
   */
  fields: IDocumentTemplateField[];
  createdAt: Date;
}

const DocumentTemplateFieldSchema = new Schema<IDocumentTemplateField>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: DOCUMENT_FIELD_TYPES, default: "text" },
    required: { type: Boolean, default: false },
    options: { type: [String] },
  },
  { _id: false }
);

const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true },
    fields: { type: [DocumentTemplateFieldSchema], default: [] },
  },
  { timestamps: true }
);

export default models.DocumentTemplate || model<IDocumentTemplate>("DocumentTemplate", DocumentTemplateSchema);
