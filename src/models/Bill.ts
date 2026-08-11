import { Schema, model, models, Types, type Document } from "mongoose";

export const BILL_STATUSES = ["unpaid", "paid", "cancelled"] as const;
export const BILL_TAX_TYPES = ["igst", "cgst_sgst", "none"] as const;

export interface IBillItem {
  description: string;
  hsnSac?: string;
  unit?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IBill extends Document {
  billNumber: string;
  customer: Types.ObjectId;
  shipment?: Types.ObjectId;
  billDate: string;
  dueDate?: string;
  items: IBillItem[];
  currency: string;
  taxType: (typeof BILL_TAX_TYPES)[number];
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: (typeof BILL_STATUSES)[number];
  notes?: string;
  createdAt: Date;
}

const BillItemSchema = new Schema<IBillItem>(
  {
    description: { type: String, required: true },
    hsnSac: { type: String },
    unit: { type: String, default: "Nos" },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    billNumber: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    shipment: { type: Schema.Types.ObjectId, ref: "Shipment" },
    billDate: { type: String, required: true },
    dueDate: { type: String },
    items: { type: [BillItemSchema], default: [] },
    currency: { type: String, default: "INR" },
    taxType: { type: String, enum: BILL_TAX_TYPES, default: "igst" },
    taxRate: { type: Number, required: true, default: 0 },
    subtotal: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: { type: String, enum: BILL_STATUSES, default: "unpaid" },
    notes: { type: String },
  },
  { timestamps: true }
);

export default models.Bill || model<IBill>("Bill", BillSchema);
