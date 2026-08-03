import { Schema, model, models, Types, type Document } from "mongoose";

export const AGREEMENT_STATUSES = ["pending", "signed", "expired"] as const;

export interface IAgreementTemplateSnapshot {
  title: string;
  forwarderName: string;
  forwarderAddress: string;
  subject: string;
  clauses: string[];
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
}

export interface IAgreementSignature {
  signedName: string;
  signatureDataUrl: string;
  signedAt: Date;
  ip?: string;
}

export interface IAgreement extends Document {
  shipment: Types.ObjectId;
  customer: Types.ObjectId;
  token: string;
  status: (typeof AGREEMENT_STATUSES)[number];
  expiresAt: Date;
  template: IAgreementTemplateSnapshot;
  signature?: IAgreementSignature;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AgreementTemplateSnapshotSchema = new Schema<IAgreementTemplateSnapshot>(
  {
    title: { type: String, required: true },
    forwarderName: { type: String, required: true },
    forwarderAddress: { type: String, default: "" },
    subject: { type: String, required: true },
    clauses: { type: [String], default: [] },
    authorizedSignatoryName: { type: String, default: "" },
    authorizedSignatoryDesignation: { type: String, default: "" },
  },
  { _id: false }
);

const AgreementSignatureSchema = new Schema<IAgreementSignature>(
  {
    signedName: { type: String, required: true },
    signatureDataUrl: { type: String, required: true },
    signedAt: { type: Date, required: true },
    ip: { type: String },
  },
  { _id: false }
);

const AgreementSchema = new Schema<IAgreement>(
  {
    shipment: { type: Schema.Types.ObjectId, ref: "Shipment", required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: AGREEMENT_STATUSES, default: "pending" },
    expiresAt: { type: Date, required: true },
    template: { type: AgreementTemplateSnapshotSchema, required: true },
    signature: { type: AgreementSignatureSchema },
    generatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default models.Agreement || model<IAgreement>("Agreement", AgreementSchema);
