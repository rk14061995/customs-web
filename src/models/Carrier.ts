import { Schema, model, models, type Document } from "mongoose";

export const CARRIER_PROVIDERS = ["Other", "UPS", "FedEx", "DHL", "Ship24"] as const;
export type CarrierProvider = (typeof CARRIER_PROVIDERS)[number];

export interface ICarrier extends Document {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  serviceAreas?: string;
  vehicleType?: string;
  active: boolean;
  notes?: string;
  /** When set to UPS/FedEx/DHL/Ship24, shipments using this carrier can be synced from a live tracking API. */
  provider: CarrierProvider;
  /** Optional Ship24 courier code hint (e.g. "dhl", "india-post"). Leave blank to let Ship24 auto-detect the courier. */
  ship24CourierCode?: string;
  createdAt: Date;
}

const CarrierSchema = new Schema<ICarrier>(
  {
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String, lowercase: true },
    serviceAreas: { type: String },
    vehicleType: { type: String },
    active: { type: Boolean, default: true },
    notes: { type: String },
    provider: { type: String, enum: CARRIER_PROVIDERS, default: "Other" },
    ship24CourierCode: { type: String },
  },
  { timestamps: true }
);

export default models.Carrier || model<ICarrier>("Carrier", CarrierSchema);
