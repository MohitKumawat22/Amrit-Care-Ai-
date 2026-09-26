import { NextResponse } from"next/server";
import connectDB from "@/lib/mongodb";
import ChatHistory from"@/models/ChatHistory";

// GET — Load chat history for a patient
export async function GET(request) {
 try {
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");
 if (!patientId) {
 return NextResponse.json({ messages: [], reports: [] });
 }

 await connectDB();
 const history = await ChatHistory.findOne({ patientId }).lean();

 if (!history) {
 return NextResponse.json({ messages: [], reports: [] });
 }

 return NextResponse.json({
 messages: history.messages || [],
 reports: (history.reports || []).map((r) => ({
 fileName: r.fileName,
 uploadedAt: r.uploadedAt,
 })),
 });
 } catch (error) {
 console.error("Chat history GET error:", error);
 return NextResponse.json({ messages: [], reports: [] });
 }
}

// POST — Save chat messages / upload report
export async function POST(request) {
 try {
 const { patientId, messages, report } = await request.json();
 if (!patientId) {
 return NextResponse.json({ error:"Missing patientId" }, { status: 400 });
 }

 await connectDB();

 let history = await ChatHistory.findOne({ patientId });

 if (!history) {
 history = new ChatHistory({ patientId, messages: [], reports: [] });
 }

 // If saving messages, replace the full message list
 if (messages && messages.length > 0) {
 history.messages = messages.map((m) => ({
 role: m.role,
 text: m.text,
 timestamp: m.timestamp || new Date(),
 }));
 }

 // If uploading a report, append it
 if (report) {
 history.reports.push({
 fileName: report.fileName,
 content: report.content,
 });
 }

 await history.save();

 return NextResponse.json({ success: true });
 } catch (error) {
 console.error("Chat history POST error:", error);
 return NextResponse.json(
 { error:"Failed to save chat history" },
 { status: 500 }
 );
 }
}
