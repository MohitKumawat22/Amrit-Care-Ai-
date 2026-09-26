import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  patientId: mongoose.Types.ObjectId;
  facilityName: string;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  placeId?: string;
  department: string;
  status: "upcoming" | "completed" | "cancelled";
  notes?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  fee?: string;
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    facilityName: { type: String, required: true },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    rating: { type: Number },
    placeId: { type: String },
    department: { type: String, default: "General" },
    status: { type: String, enum: ["upcoming", "completed", "cancelled"], default: "upcoming" },
    notes: { type: String },
    scheduledDate: { type: String },
    scheduledSlot: { type: String },
    fee: { type: String },
  },
  { timestamps: true }
);

const BookingModel: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default BookingModel;
