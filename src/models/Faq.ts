import { Schema, model, models, type Document } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
  category: string;
  order: number;
  createdAt: Date;
}

const FaqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Faq || model<IFaq>("Faq", FaqSchema);
