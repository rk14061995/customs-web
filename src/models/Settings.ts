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
  usdToInrRate: number;
  gstin?: string;
  pan?: string;
  udyamNumber?: string;
  stateName?: string;
  stateCode?: string;
  jurisdiction?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankIfsc?: string;
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
    usdToInrRate: { type: Number, default: 96 },
    gstin: { type: String },
    pan: { type: String },
    udyamNumber: { type: String },
    stateName: { type: String },
    stateCode: { type: String },
    jurisdiction: { type: String },
    bankAccountHolder: { type: String },
    bankName: { type: String },
    bankAccountNumber: { type: String },
    bankBranch: { type: String },
    bankIfsc: { type: String },
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
