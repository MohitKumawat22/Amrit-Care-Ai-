import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatMessage {
  role: "user" | "bot";
  text: string;
  timestamp?: Date;
}

export interface IReport {
  fileName: string;
  content: string;
  uploadedAt?: Date;
}

export interface IChatHistory extends Document {
  patientId: string;
  messages: IChatMessage[];
  reports: IReport[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatHistorySchema = new Schema<IChatHistory>({
  patientId: { type: String, required: true, index: true },
  messages: [MessageSchema],
  reports: [
    {
      fileName: String,
      content: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ChatHistorySchema.pre("save", function () {
  this.updatedAt = new Date();
});

const ChatHistoryModel: Model<IChatHistory> =
  (mongoose.models.ChatHistory as Model<IChatHistory>) ||
  mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);

export default ChatHistoryModel;
