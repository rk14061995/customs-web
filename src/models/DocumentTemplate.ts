import { Schema, model, models, type Document } from "mongoose";

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
  createdAt: Date;
}

const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default models.DocumentTemplate || model<IDocumentTemplate>("DocumentTemplate", DocumentTemplateSchema);
