import { Schema, model, models, Types, type Document } from "mongoose";

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Card",
  "UPI",
  "Cheque",
  "Online",
  "Other",
] as const;

export const PAYMENT_TX_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially-refunded",
] as const;

export interface IPayment extends Document {
  shipment: Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  currency: string;
  method: (typeof PAYMENT_METHODS)[number];
  status: (typeof PAYMENT_TX_STATUSES)[number];
  paidAt?: string;
  dueDate?: string;
  notes?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    shipment: { type: Schema.Types.ObjectId, ref: "Shipment", required: true },
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: PAYMENT_METHODS, default: "Bank Transfer" },
    status: { type: String, enum: PAYMENT_TX_STATUSES, default: "pending" },
    paidAt: { type: String },
    dueDate: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default models.Payment || model<IPayment>("Payment", PaymentSchema);
