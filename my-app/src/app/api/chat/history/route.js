import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";
// GET — Load chat history for a patient
export async function GET(request) {
 try {
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");
 if (!patientId) {
 return NextResponse.json({ messages: [], reports: [] });
 }

 const { data: history, error } = await supabase
 .from("chat_histories")
 .select("*")
 .eq("patient_id", patientId)
 .single();

 if (error || !history) {
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

 // Check if history exists
 const { data: existing } = await supabase
 .from("chat_histories")
 .select("*")
 .eq("patient_id", patientId)
 .single();

 if (existing) {
 // Update existing
 const updates = { updated_at: new Date().toISOString() };

 if (messages && messages.length > 0) {
 updates.messages = messages.map((m) => ({
 role: m.role,
 text: m.text,
 timestamp: m.timestamp || new Date().toISOString(),
 }));
 }

 if (report) {
 const reports = existing.reports || [];
 reports.push({
 fileName: report.fileName,
 content: report.content,
 uploadedAt: new Date().toISOString(),
 });
 updates.reports = reports;
 }

 const { error } = await supabase
 .from("chat_histories")
 .update(updates)
 .eq("patient_id", patientId);

 if (error) {
 console.error("Chat history update error:", error);
 return NextResponse.json({ error:"Failed to save chat history" }, { status: 500 });
 }
 } else {
 // Create new
 const newMessages = messages ? messages.map((m) => ({
 role: m.role,
 text: m.text,
 timestamp: m.timestamp || new Date().toISOString(),
 })) : [];

 const newReports = report ? [{
 fileName: report.fileName,
 content: report.content,
 uploadedAt: new Date().toISOString(),
 }] : [];

 const { error } = await supabase
 .from("chat_histories")
 .insert({
 patient_id: patientId,
 messages: newMessages,
 reports: newReports,
 });

 if (error) {
 console.error("Chat history insert error:", error);
 return NextResponse.json({ error:"Failed to save chat history" }, { status: 500 });
 }
 }

 return NextResponse.json({ success: true });
 } catch (error) {
 console.error("Chat history POST error:", error);
 return NextResponse.json({ error:"Failed to save chat history" }, { status: 500 });
 }
}
