import { Schema, model, models, type Document } from "mongoose";

/**
 * One file a customer submitted back for a DocumentRequest item (their filled/scanned copy of
 * a form). Kept as its own top-level collection — not embedded in DocumentRequest — so a
 * request with several uploads can't approach MongoDB's 16MB document size limit.
 */
export interface IDocumentUpload extends Document {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
  uploadedAt: Date;
}

const DocumentUploadSchema = new Schema<IDocumentUpload>({
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileData: { type: Buffer, required: true },
  uploadedAt: { type: Date, required: true, default: Date.now },
});

export default models.DocumentUpload || model<IDocumentUpload>("DocumentUpload", DocumentUploadSchema);
