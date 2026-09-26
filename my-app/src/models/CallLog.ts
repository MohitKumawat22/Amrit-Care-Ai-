import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITranscriptEntry {
  role: "assistant" | "patient";
  text: string;
  timestamp?: Date;
}

export interface ICallLog extends Document {
  patientId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  status: "scheduled" | "in-progress" | "completed" | "failed" | "cancelled";
  callSid?: string;
  retryCount: number;
  nextRetryAt?: Date;
  context?: any;
  greeting?: string;
  transcript: ITranscriptEntry[];
  summary?: string;
  severity: "critical" | "high" | "moderate" | "low" | "info";
  notes?: string;
  recurrence: "one-time" | "weekly" | "monthly";
  overridePhone?: string;
  overrideName?: string;
  parentCallId?: mongoose.Types.ObjectId;
  memory?: {
    symptoms?: string[];
    mood?: string;
    followUpTopics?: string[];
    rawSummary?: string;
  };
  createdAt: Date;
}

const transcriptEntrySchema = new Schema<ITranscriptEntry>(
  {
    role: { type: String, enum: ["assistant", "patient"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CallLogSchema = new Schema<ICallLog>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "failed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    callSid: { type: String, default: null },
    retryCount: { type: Number, default: 0, max: 2 },
    nextRetryAt: { type: Date, default: null },
    context: {
      patient: { type: Object, default: null },
      lastTriage: { type: Object, default: null },
      recentBookings: { type: Array, default: [] },
      pastCallSummaries: { type: Array, default: [] },
      pastMemories: { type: Array, default: [] },
    },
    greeting: { type: String, default: null },
    transcript: { type: [transcriptEntrySchema], default: [] },
    summary: { type: String, default: null },
    severity: {
      type: String,
      enum: ["critical", "high", "moderate", "low", "info"],
      default: "info",
    },
    notes: { type: String, default: "" },
    recurrence: {
      type: String,
      enum: ["one-time", "weekly", "monthly"],
      default: "one-time",
    },
    overridePhone: { type: String, default: null },
    overrideName: { type: String, default: null },
    parentCallId: { type: Schema.Types.ObjectId, ref: "CallLog", default: null },
    memory: {
      symptoms: { type: [String], default: [] },
      mood: { type: String, default: null },
      followUpTopics: { type: [String], default: [] },
      rawSummary: { type: String, default: null },
    },
  },
  { timestamps: true }
);

const CallLogModel: Model<ICallLog> =
  (mongoose.models.CallLog as Model<ICallLog>) ||
  mongoose.model<ICallLog>("CallLog", CallLogSchema);

export default CallLogModel;
