import { Schema, model, models, type Document } from "mongoose";

export interface IAgreementTemplate extends Document {
  title: string;
  forwarderName: string;
  forwarderAddress: string;
  subject: string;
  clauses: string[];
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
  updatedAt: Date;
}

export const DEFAULT_AGREEMENT_CLAUSES = [
  "I have handed over the customs related document by mail to the Forwarder as per my instructions.",
  "I declare that the description, quantity, quality, weight, packing, invoice, and all documents related to the goods are true and correct.",
  "If, during transit or at the time of inspection by any authority or at the destination, any wrong goods, undeclared goods, prohibited goods, excess goods, shortage, mismatch, or discrepancy is found, the customer shall be solely responsible for the same.",
  "The customer shall bear all consequences arising from such discrepancies, including applicable penalties, taxes, duties, fines, legal proceedings, claims, or any other liabilities imposed by any authority or third party, to the extent they arise from the customer's goods, declarations, or instructions.",
  "The customer agrees to indemnify and keep the Forwarder indemnified against any loss, damage, claim, expense, penalty, or legal liability incurred due to any incorrect declaration, shortage, excess, or prohibited goods provided by the customer.",
  "The Forwarder acts only as a forwarding service provider based on the information and documents provided by the customer.",
];

const AgreementTemplateSchema = new Schema<IAgreementTemplate>(
  {
    title: { type: String, required: true, default: "Goods Handover & Customer Responsibility Agreement" },
    forwarderName: { type: String, required: true, default: "Rana Forwarder" },
    forwarderAddress: { type: String, default: "" },
    subject: { type: String, required: true, default: "Declaration and Responsibility for Goods Handed Over" },
    clauses: { type: [String], default: DEFAULT_AGREEMENT_CLAUSES },
    authorizedSignatoryName: { type: String, default: "" },
    authorizedSignatoryDesignation: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.AgreementTemplate ||
  model<IAgreementTemplate>("AgreementTemplate", AgreementTemplateSchema);
