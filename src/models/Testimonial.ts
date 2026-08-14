import { Schema, model, models, type Document } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  company?: string;
  role?: string;
  email?: string;
  quote: string;
  rating: number;
  avatar: string;
  published: boolean;
  source: "admin" | "customer";
  createdAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    company: { type: String },
    role: { type: String },
    // Submitter's email — only used for admin follow-up, never rendered on the public site.
    email: { type: String },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatar: { type: String, required: true },
    published: { type: Boolean, default: true },
    // "customer" = submitted via the public /reviews form (starts unpublished, pending approval).
    // "admin" = added directly in the admin panel (published by default, as before).
    source: { type: String, enum: ["admin", "customer"], default: "admin" },
  },
  { timestamps: true }
);

export default models.Testimonial || model<ITestimonial>("Testimonial", TestimonialSchema);
