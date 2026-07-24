import { Schema, model, models, type Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
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
    notes: { type: String },
  },
  { timestamps: true }
);

export default models.Customer || model<ICustomer>("Customer", CustomerSchema);
