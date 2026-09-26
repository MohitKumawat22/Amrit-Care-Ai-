import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ITriage extends Document {
  patientId: mongoose.Types.ObjectId;
  title: string;
  severity: "critical" | "high" | "moderate" | "low" | "info";
  symptoms: string[];
  transcript: IMessage[];
  recommendation?: string;
  lang: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const TriageSchema = new Schema<ITriage>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    title: { type: String, required: true },
    severity: { type: String, enum: ["critical", "high", "moderate", "low", "info"], default: "info" },
    symptoms: [{ type: String }],
    transcript: [messageSchema],
    recommendation: { type: String },
    lang: { type: String, default: "en" },
  },
  { timestamps: true }
);

const TriageModel: Model<ITriage> =
  (mongoose.models.Triage as Model<ITriage>) ||
  mongoose.model<ITriage>("Triage", TriageSchema);

export default TriageModel;
