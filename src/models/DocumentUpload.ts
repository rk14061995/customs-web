import { Schema, model, models, type Document } from "mongoose";

/**
 * One file a customer submitted back for a DocumentRequest item — either their filled/scanned
 * copy of a form, or a PDF generated from an online form submission (see documentFormPdf.ts),
 * in which case `answers` also holds the raw typed values. Kept as its own top-level collection
 * — not embedded in DocumentRequest — so a request with several uploads can't approach
 * MongoDB's 16MB document size limit.
 */
export interface IDocumentUpload extends Document {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
  answers?: Record<string, string>;
  uploadedAt: Date;
}

const DocumentUploadSchema = new Schema<IDocumentUpload>({
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileData: { type: Buffer, required: true },
  answers: { type: Schema.Types.Mixed },
  uploadedAt: { type: Date, required: true, default: Date.now },
});

export default models.DocumentUpload || model<IDocumentUpload>("DocumentUpload", DocumentUploadSchema);
