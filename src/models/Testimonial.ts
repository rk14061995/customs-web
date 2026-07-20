import { Schema, model, models, type Document } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  company: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
  published: boolean;
  createdAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatar: { type: String, required: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Testimonial || model<ITestimonial>("Testimonial", TestimonialSchema);
