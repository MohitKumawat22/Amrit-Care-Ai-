import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  specialty: string;
  hospital: string;
  bio: string;
  photo?: string;
  availableSlots: Array<{
    day: string;
    time: string;
    isBooked: boolean;
  }>;
  createdAt: Date;
}

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    specialty: { type: String, required: true },
    hospital: { type: String, required: true },
    bio: { type: String, required: true },
    photo: { type: String },
    availableSlots: [
      {
        day: { type: String, required: true },
        time: { type: String, required: true },
        isBooked: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const DoctorProfileModel: Model<IDoctorProfile> =
  (mongoose.models.DoctorProfile as Model<IDoctorProfile>) ||
  mongoose.model<IDoctorProfile>("DoctorProfile", DoctorProfileSchema);

export default DoctorProfileModel;
