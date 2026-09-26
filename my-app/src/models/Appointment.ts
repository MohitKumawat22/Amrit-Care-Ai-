import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppointment extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  patientInfo: {
    name: string;
    age: number;
    phone: string;
    complaint: string;
  };
  slot: {
    day: string;
    time: string;
  };
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientInfo: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      phone: { type: String, required: true },
      complaint: { type: String, required: true },
    },
    slot: {
      day: { type: String, required: true },
      time: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const AppointmentModel: Model<IAppointment> =
  (mongoose.models.Appointment as Model<IAppointment>) ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default AppointmentModel;
