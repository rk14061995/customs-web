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
  },
  { timestamps: true }
);

export default models.Customer || model<ICustomer>("Customer", CustomerSchema);
