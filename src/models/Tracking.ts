import { Schema, model, models, type Document } from "mongoose";

export interface ITrackingEvent {
  status: string;
  location: string;
  date: string;
  completed: boolean;
}

export interface ITracking extends Document {
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  events: ITrackingEvent[];
  createdAt: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    status: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const TrackingSchema = new Schema<ITracking>(
  {
    trackingNumber: { type: String, required: true, unique: true, uppercase: true },
    status: { type: String, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    estimatedDelivery: { type: String, required: true },
    events: { type: [TrackingEventSchema], default: [] },
  },
  { timestamps: true }
);

export default models.Tracking || model<ITracking>("Tracking", TrackingSchema);
