import { Schema, model, models, type Document } from "mongoose";

export interface IService extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  icon: string;
  image: string;
  benefits: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    image: { type: String, required: true },
    benefits: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Service || model<IService>("Service", ServiceSchema);
