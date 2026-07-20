import { Schema, model, models, type Document } from "mongoose";

export interface IHomepage extends Document {
  heroHeadline: string;
  heroSubtitle: string;
  stats: { label: string; value: number; suffix: string }[];
  updatedAt: Date;
}

const HomepageSchema = new Schema<IHomepage>(
  {
    heroHeadline: { type: String, required: true },
    heroSubtitle: { type: String, required: true },
    stats: {
      type: [
        {
          label: { type: String, required: true },
          value: { type: Number, required: true },
          suffix: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default models.Homepage || model<IHomepage>("Homepage", HomepageSchema);
