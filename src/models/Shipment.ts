import { Schema, model, models, Types, type Document } from "mongoose";

export interface IShipmentEvent {
  status: string;
  location: string;
  date: string;
  completed: boolean;
  notes?: string;
}

export const SHIPMENT_STATUSES = [
  "Booked",
  "Picked Up",
  "In Transit",
  "Customs Clearance",
  "Out For Delivery",
  "Delivered",
  "On Hold",
  "Cancelled",
] as const;

export const SERVICE_TYPES = [
  "Domestic Courier",
  "International Courier",
  "Air Freight",
  "Ocean Freight",
  "Road Transport",
  "Express Delivery",
  "Warehousing",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "refunded"] as const;

export interface IShipment extends Document {
  trackingNumber: string;
  customer: Types.ObjectId;
  carrier?: Types.ObjectId;
  /** The AWB / tracking number issued by the carrier (UPS/FedEx/DHL), used to sync live tracking. Distinct from our own trackingNumber above. */
  carrierTrackingNumber?: string;
  serviceType: string;
  origin: string;
  destination: string;
  weight: string;
  dimensions?: string;
  packages: number;
  status: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  events: IShipmentEvent[];
  cost: number;
  currency: string;
  paymentStatus: (typeof PAYMENT_STATUSES)[number];
  notes?: string;
  createdAt: Date;
}

const ShipmentEventSchema = new Schema<IShipmentEvent>(
  {
    status: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    completed: { type: Boolean, default: false },
    notes: { type: String },
  },
  { _id: false }
);

const ShipmentSchema = new Schema<IShipment>(
  {
    trackingNumber: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    carrier: { type: Schema.Types.ObjectId, ref: "Carrier" },
    carrierTrackingNumber: { type: String },
    serviceType: { type: String, enum: SERVICE_TYPES, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    weight: { type: String, required: true },
    dimensions: { type: String },
    packages: { type: Number, default: 1 },
    status: { type: String, enum: SHIPMENT_STATUSES, default: "Booked" },
    estimatedDelivery: { type: String, required: true },
    actualDelivery: { type: String },
    events: { type: [ShipmentEventSchema], default: [] },
    cost: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    notes: { type: String },
  },
  { timestamps: true }
);

export default models.Shipment || model<IShipment>("Shipment", ShipmentSchema);
