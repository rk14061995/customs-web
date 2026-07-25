import { Schema, model, models, type Document } from "mongoose";

export interface ISettings extends Document {
  siteName: string;
  tagline: string;
  phone: string;
  alternatePhone?: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  description?: string;
  ga4MeasurementId?: string;
  googleAdsId?: string;
  social: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, required: true },
    tagline: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    hours: { type: String, required: true },
    description: { type: String },
    ga4MeasurementId: { type: String },
    googleAdsId: { type: String },
    social: {
      facebook: String,
      twitter: String,
      linkedin: String,
      instagram: String,
    },
  },
  { timestamps: true }
);

export default models.Settings || model<ISettings>("Settings", SettingsSchema);
