import { Schema, model, models, type Document } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "responded" | "closed";
  createdAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "responded", "closed"], default: "new" },
  },
  { timestamps: true }
);

export default models.Contact || model<IContact>("Contact", ContactSchema);
