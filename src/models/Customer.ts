import { Schema, model, models, type Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  gstNumber?: string;
  stateName?: string;
  stateCode?: string;
  notes?: string;
  /** Set once the customer signs up for portal access. Admin-created records start without one. */
  passwordHash?: string;
  /** Denormalized cached balance — the WalletTransaction ledger is the source of truth for history,
   *  this field is kept in sync atomically (findOneAndUpdate with a balance guard) on every credit/debit. */
  walletBalance: number;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    company: { type: String },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String },
    gstNumber: { type: String },
    stateName: { type: String },
    stateCode: { type: String },
    notes: { type: String },
    passwordHash: { type: String, select: false },
    walletBalance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default models.Customer || model<ICustomer>("Customer", CustomerSchema);
