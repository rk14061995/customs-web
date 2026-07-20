import { Schema, model, models, type Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image: string;
  readTime: string;
  date: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String, required: true },
    readTime: { type: String, default: "5 min read" },
    date: { type: String, required: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Blog || model<IBlog>("Blog", BlogSchema);
