import { Schema, model, models, Types, type Document } from "mongoose";

export const CHARGE_BASES = ["flat", "per_kg"] as const;

export interface IQuoteCharge {
  label: string;
  basis: (typeof CHARGE_BASES)[number];
  rate: number;
}

export const QUOTATION_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;

export interface IQuotation extends Document {
  quoteNumber: string;
  customer: Types.ObjectId;
  origin: string;
  destination: string;
  serviceType: string;
  weightKg: number;
  /** Number of boxes/packages being shipped. Informational only — not used in any price calculation. */
  quantity: number;
  dimensions?: string;
  charges: IQuoteCharge[];
  currency: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: (typeof QUOTATION_STATUSES)[number];
  validUntil?: string;
  notes?: string;
  createdAt: Date;
}

const QuoteChargeSchema = new Schema<IQuoteCharge>(
  {
    label: { type: String, required: true },
    basis: { type: String, enum: CHARGE_BASES, default: "flat" },
    rate: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const QuotationSchema = new Schema<IQuotation>(
  {
    quoteNumber: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    serviceType: { type: String, required: true },
    weightKg: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    dimensions: { type: String },
    charges: { type: [QuoteChargeSchema], default: [] },
    currency: { type: String, default: "INR" },
    taxRate: { type: Number, required: true, default: 18 },
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: { type: String, enum: QUOTATION_STATUSES, default: "draft" },
    validUntil: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default models.Quotation || model<IQuotation>("Quotation", QuotationSchema);
