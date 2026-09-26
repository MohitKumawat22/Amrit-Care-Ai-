import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

const getSystemPrompt = () => {
 const now = new Date();
 const currentDateTime = now.toLocaleString("en-IN", { timeZone:"Asia/Kolkata", dateStyle:"full", timeStyle:"short" });
 const isoDate = now.toISOString().split("T")[0];

 return `You are AmritCare AI — a warm, smart health companion built into the AmritCare app. Think of yourself as a caring friend who happens to know a lot about health.

CURRENT SYSTEM DATE & TIME: ${currentDateTime}
(Use this to accurately determine"today","tomorrow", etc.)

PERSONALITY:
- Friendly, warm, natural — like texting a knowledgeable friend
- Support Hinglish (mix of Hindi + English) naturally
- Match the user's energy — casual if they're casual, detailed if they need health help
- NEVER be robotic, formal, or start with"I understand you're dealing with..."
- Keep responses SHORT unless the user has a real health concern

CORE RULES:
1. NEVER prescribe or recommend specific medicines/drugs.
2. Suggest home remedies, lifestyle tips, and natural treatments only.
3. Recommend the right specialist when relevant — but don't push it every time.
4. Emergency (chest pain, difficulty breathing, severe bleeding) → tell them to call 112 immediately.
5. Use past medical reports if shared for personalized advice.

RESPONSE STYLE — CRITICAL:

▸ CASUAL / SMALL TALK (hi, hello, jokes, random text, non-health): Reply in 1-2 sentences MAX. Be warm and natural. Do NOT use the health template. Do NOT ask"How can I assist you?" every time — be more human.
 Examples:
 -"Hi!" →"Hey! How are you feeling today? 😊"
 -"I'm bored" →"Ha, same energy sometimes 😄 Need any health tips or just wanna chat?"
 -"Thanks" →"Anytime! Take care 💙"
 - Random keysmash ("njkkk","MMMM") →"Lol, seems like your keyboard is having a moment 😄 What's up?"

▸ HEALTH / SYMPTOM QUESTIONS (fever, pain, tiredness, cough etc.):
 Be warm but informative. Use this format ONLY for real symptoms:"[Empathetic 1-liner about the symptom]

 Could be because of:
 • [reason 1]
 • [reason 2]

 🏠 Try this:
 • [remedy 1]
 • [remedy 2]

 If it doesn't improve, see a [Specialist]. Take care! 💙"

▸ ACTION REQUESTS (booking, scheduling, navigating):
 1-2 sentences only. Direct and helpful.

ACTION TAGS — Add at END of reply ONLY when needed:

• Book appointment: [BOOK_APPOINTMENT:Specialty_Name]
• Schedule call (2-step):
 - If no date/time given → ask:"Sure! When works for you? 😊" (no tag yet)
 - Once date+time given → [SCHEDULE_CALL_AT:YYYY-MM-DDTHH:MM] (Must be in the future! Use 24-hour time e.g., 5 PM = 17:00. Today is ${isoDate})
• Navigate: [NAVIGATE:/path]
 - Dashboard/Appointments → /patient/dashboard
 - History → /patient/history - AI Triage → /patient/triage
 - Find Hospital → /patient/locate
 - Reminders → /reminders
• Calendar: [ADD_CALENDAR:Specialty:reason]`;
};

const REMINDER_EXTRACTION_PROMPT = `You are MediAI, a hospital assistant. The user wants to set a medicine reminder.

Extract the medicine reminder details and respond ONLY in this JSON format:
{"reminderData": {"medicineName":"Medicine name","medicineType":"tablet | capsule | syrup | injection | drops","dosage":"e.g. 500mg","frequency":"once_daily | twice_daily | thrice_daily | every_4_hours | every_6_hours | every_8_hours | once_weekly | twice_weekly | alternate_days","times": ["HH:MM","HH:MM"],"totalQuantity": number,"tabletsPerDose": number,"notes":"any special instructions"
 },"confirmMessage":"Friendly 1-sentence confirmation of what you understood"
}

Rules:
- If user says"morning evening" → times: ["08:00","20:00"]
- If user says"morning afternoon night" → times: ["08:00","13:00","21:00"]
- If user says"once a week on Monday" → frequency:"once_weekly", specificDays: [1]
- If user says"30 tablets" → totalQuantity: 30
- Default tabletsPerDose is 1 unless stated otherwise
- Respond ONLY with the JSON. No other text.`;

export async function POST(request) {
 try {
 const { messages, patientInfo, patientId, isReminderPrompt } = await request.json();

 const apiKey = process.env.GROQ_API_KEY;
 if (!apiKey) {
 return NextResponse.json({
 reply:"I'm sorry, the AI service is not configured yet. Please add the GROQ_API_KEY to the environment variables.",
 });
 }

 // Build messages array with system prompt
 const chatMessages = [{ role:"system", content: isReminderPrompt ? REMINDER_EXTRACTION_PROMPT : getSystemPrompt() }];

 // Add patient context if available
 if (patientInfo) {
 chatMessages.push({
 role:"system",
 content: `Patient info — Name: ${patientInfo.firstName ||"Unknown"}, Age: ${patientInfo.age ||"Unknown"}, Blood Group: ${patientInfo.blood ||"Unknown"}. Use this context to personalize advice.`,
 });
 }

  // Load past history & reports from DB for richer context
  if (patientId) {
    try {
      const { data: history, error } = await supabase.from("chat_histories").select("*").eq("patient_id", patientId).single();

 if (history) {
 // Inject uploaded medical reports as context
 if (history.reports && history.reports.length > 0) {
 const reportSummaries = history.reports
 .map(
 (r) =>
 `📄 Report"${r.fileName}" (uploaded ${new Date(r.uploadedAt).toLocaleDateString()}):\n${r.content}`
 )
 .join("\n\n");

 chatMessages.push({
 role:"system",
 content: `The patient has shared the following medical reports. Use this data to give more accurate, personalized advice:\n\n${reportSummaries}`,
 });
 }

 // Inject a summary of past conversations (last 20 messages) for continuity
 if (history.messages && history.messages.length > 0) {
 const pastMsgs = history.messages.slice(-20);
 const pastSummary = pastMsgs
 .map((m) => `${m.role ==="user" ?"Patient" :"AI"}: ${m.text}`)
 .join("\n");

 chatMessages.push({
 role:"system",
 content: `Here is a summary of the patient's PREVIOUS conversations with you. Use this for continuity — reference past symptoms, recommendations, or concerns when relevant:\n\n${pastSummary}`,
 });
 }
 }
 } catch (dbErr) {
 console.error("DB context load error (non-fatal):", dbErr);
 // Continue without DB context — still respond
 }
 }

 // Add current conversation messages
 if (Array.isArray(messages)) {
 for (const msg of messages) {
 chatMessages.push({
 role: msg.role ==="bot" || msg.role ==="assistant" ?"assistant" :"user",
 content: msg.text || msg.content ||"",
 });
 }
 }

 const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
 method:"POST",
 headers: {"Content-Type":"application/json",
 Authorization: `Bearer ${apiKey}`,
 },
 body: JSON.stringify({
 model:"llama-3.3-70b-versatile",
 messages: chatMessages,
 temperature: 0.7,
 max_tokens: 512,
 }),
 });

 if (!res.ok) {
 const errText = await res.text();
 console.error("Groq API error:", res.status, errText);
 return NextResponse.json(
 {
 reply:"I'm having trouble connecting right now. Please try again in a moment, or consult a doctor directly.",
 },
 { status: 200 }
 );
 }

 const data = await res.json();
 let reply =
 data.choices?.[0]?.message?.content ||"I'm sorry, I couldn't generate a response. Please try again.";

 // If it was a reminder prompt, try to parse JSON
 if (isReminderPrompt) {
 try {
 // Find JSON block if it's wrapped in backticks
 const jsonMatch = reply.match(/\{[\s\S]*\}/);
 const jsonStr = jsonMatch ? jsonMatch[0] : reply;
 const parsed = JSON.parse(jsonStr);
 return NextResponse.json(parsed);
 } catch (err) {
 console.error("Failed to parse reminder JSON", reply);
 return NextResponse.json({ error:"Failed to parse AI response" }, { status: 500 });
 }
 }

 // Parse action tags from the reply
 const actions = [];

 // Parse [BOOK_APPOINTMENT:Specialty]
 const bookMatch = reply.match(/\[BOOK_APPOINTMENT:(.*?)\]/);
 if (bookMatch) {
 actions.push({ type:"book_appointment", specialty: bookMatch[1].trim() });
 reply = reply.replace(bookMatch[0],"").trim();
 }

 // Parse [SCHEDULE_CALL_AT:datetime]
 const callAtMatch = reply.match(/\[SCHEDULE_CALL_AT:([\d\-T:]+)\]/);
 if (callAtMatch) {
 actions.push({ type:"schedule_call_at", datetime: callAtMatch[1].trim() });
 reply = reply.replace(callAtMatch[0],"").trim();
 }

 // Parse legacy [SCHEDULE_CALL:reason] (kept for backward compat)
 const callMatch = reply.match(/\[SCHEDULE_CALL:(.*?)\]/);
 if (callMatch) {
 actions.push({ type:"schedule_call", reason: callMatch[1].trim() });
 reply = reply.replace(callMatch[0],"").trim();
 }

 // Parse [NAVIGATE:/path]
 const navMatch = reply.match(/\[NAVIGATE:(.*?)\]/);
 if (navMatch) {
 actions.push({ type:"navigate", path: navMatch[1].trim() });
 reply = reply.replace(navMatch[0],"").trim();
 }

 // Parse [ADD_CALENDAR:specialty:reason]
 const calMatch = reply.match(/\[ADD_CALENDAR:(.*?)\]/);
 if (calMatch) {
 const parts = calMatch[1].split(":");
 actions.push({
 type:"add_calendar",
 specialty: parts[0]?.trim() ||"General Physician",
 reason: parts[1]?.trim() ||"Health consultation",
 });
 reply = reply.replace(calMatch[0],"").trim();
 }

 return NextResponse.json({ reply, actions });
 } catch (error) {
 console.error("Chat API error:", error);
 return NextResponse.json(
 { reply:"Something went wrong. Please try again later." },
 { status: 200 }
 );
 }
}
