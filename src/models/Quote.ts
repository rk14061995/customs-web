import { Schema, model, models, Types, type Document } from "mongoose";

export interface IQuote extends Document {
  name: string;
  company?: string;
  phone: string;
  email: string;
  pickupLocation: string;
  destination: string;
  shipmentType: string;
  weight: string;
  dimensions?: string;
  pickupDate: string;
  message?: string;
  status: "new" | "contacted" | "quoted" | "closed";
  /** Set when this request was submitted by a logged-in customer from their dashboard,
   *  rather than the anonymous public quote form. */
  customer?: Types.ObjectId;
  createdAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    name: { type: String, required: true },
    company: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    destination: { type: String, required: true },
    shipmentType: { type: String, required: true },
    weight: { type: String, required: true },
    dimensions: { type: String },
    pickupDate: { type: String, required: true },
    message: { type: String },
    status: { type: String, enum: ["new", "contacted", "quoted", "closed"], default: "new" },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
  },
  { timestamps: true }
);

export default models.Quote || model<IQuote>("Quote", QuoteSchema);
