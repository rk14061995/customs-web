import { Schema, model, models, type Document } from "mongoose";

export interface ITeamMember extends Document {
  name: string;
  role: string;
  image: string;
  bio: string;
  order: number;
  createdAt: Date;
}

const TeamSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    image: { type: String, required: true },
    bio: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Team || model<ITeamMember>("Team", TeamSchema);
