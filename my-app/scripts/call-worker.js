#!/usr/bin/env node
/**
 * call-worker.js — AmritCare AI Call Scheduler
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const cron = require("node-cron");
const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

// ─── Env validation ────────────────────────────────────────────
const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  GROQ_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  NGROK_URL,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE env vars are required in .env.local");
  process.exit(1);
}
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.warn("⚠️  Twilio credentials missing — calls will NOT fire.");
}
if (!NGROK_URL) {
  console.warn("⚠️  NGROK_URL is not set — webhook URL will be empty.");
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Groq API helper ──────────────────────────────────────────
async function callGroq(messages, maxTokens = 80) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Context fetcher ──────────────────────────────────────────
async function fetchPatientContext(patientId) {
  const { data: patient } = await supabase.from('patients').select('*').eq('id', patientId).single();
  const { data: latestTriages } = await supabase.from('triages').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1);
  const { data: recentBookings } = await supabase.from('bookings').select('*').eq('patient_id', patientId).in('status', ['upcoming', 'completed']).order('created_at', { ascending: false }).limit(2);
  const { data: pastCalls } = await supabase.from('call_logs').select('summary, severity, created_at').eq('patient_id', patientId).eq('status', 'completed').order('created_at', { ascending: false }).limit(3);
  const { data: pastMemoryLogs } = await supabase.from('call_logs').select('memory, created_at').eq('patient_id', patientId).eq('status', 'completed').not('memory->mood', 'is', null).order('created_at', { ascending: false }).limit(3);

  return {
    patient,
    lastTriage: latestTriages?.[0] || null,
    recentBookings: recentBookings || [],
    pastCallSummaries: pastCalls || [],
    pastMemories: pastMemoryLogs || [],
  };
}

// ─── Greeting generator ───────────────────────────────────────
async function generateGreeting(context, notes, overrideName) {
  const { patient, pastMemories } = context;
  const displayName = overrideName || patient?.first_name || "there";

  const systemPrompt = `You are AmritCare, a friendly neighborhood family doctor calling for a health checkup.
You are warm, knowledgeable, and approachable — like a doctor who lives in the same colony 
and genuinely knows and cares about their patients.

Address the patient by their first name with "aap" — never Bhaiya/Didi.
Speak in true Hinglish — 50% English and 50% Hindi naturally mixed in every sentence.
Use Polly.Aditi voice-friendly language — natural, conversational, not text-heavy.
Keep the greeting to exactly 2 sentences.
First sentence: greet and introduce the call.
Second sentence: ask how they are feeling in a warm, natural way.

Patient name: ${displayName}
Patient notes: ${notes || "none"}

Example 1 (no notes):
"Ravi, AmritCare ki taraf se call aa raha hai — aapka routine checkup tha aaj. 
Aap kaisa feel kar rahe hain, sab theek chal raha hai?"`;

  let userContent = `Patient: ${displayName}`;

  if (pastMemories?.length) {
    userContent += `\n\nPrevious call history (use this to follow up naturally):`;
    pastMemories.forEach((m) => {
      const mem = m.memory || {};
      const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString() : "previous call";
      userContent += `\n- [${dateStr}] Symptoms: ${(mem.symptoms || []).join(", ") || "none"}. Mood: ${mem.mood || "unknown"}. Follow up on: ${(mem.followUpTopics || []).join(", ") || "none"}.`;
    });
    userContent += `\n\nImportant:
- Reference previous symptoms naturally in conversation — do not list them out loud
- Weave follow-ups into the conversation, don't ask them all at once
- If mood was low last time, be extra warm this call
- If symptoms have resolved, express genuine relief`;
  }

  userContent += "\n\nGenerate the 2-sentence greeting now.";

  try {
    return await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      100
    );
  } catch (e) {
    console.error("Greeting generation failed:", e);
    return `${displayName}, AmritCare ki taraf se call aa raha hai — aapka routine checkup tha aaj. Aap kaisa feel kar rahe hain?`;
  }
}

// ─── Main poll worker ─────────────────────────────────────────
async function processDueCalls() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30_000).toISOString();

  const { data: dueCalls, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', windowEnd);

  if (error || !dueCalls || dueCalls.length === 0) return;
  console.log(`🔔 Found ${dueCalls.length} due call(s)`);

  for (const call of dueCalls) {
    try {
      console.log(`  → Processing call ${call.id} for patient ${call.patient_id}`);

      // Mark in-progress immediately to prevent double-processing
      await supabase.from('call_logs').update({ status: 'in-progress' }).eq('id', call.id);

      // 1. Fetch full context
      const context = await fetchPatientContext(call.patient_id);

      // 2. Generate greeting (use overrideName from scheduler form if set)
      const greeting = await generateGreeting(context, call.notes, call.override_name);

      // 3. Save context + greeting
      await supabase.from('call_logs').update({ context, greeting }).eq('id', call.id);

      // 4. Get patient phone — prefer overridePhone set by the scheduler UI
      const phoneNumber = call.override_phone || context.patient?.phone;
      if (!phoneNumber) {
        console.error(`  ✗ Patient ${call.patient_id} has no phone number`);
        await supabase.from('call_logs').update({ status: 'failed' }).eq('id', call.id);
        continue;
      }

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        console.warn(`  ⚠ Twilio not configured — skipping actual call for ${call.id}`);
        await supabase.from('call_logs').update({ status: 'failed' }).eq('id', call.id);
        continue;
      }

      // 5. Fire Twilio outbound call
      const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const webhookUrl = `${NGROK_URL}/api/twilio/voice?callLogId=${call.id}`;
      const statusCallbackUrl = `${NGROK_URL}/api/twilio/voice?callLogId=${call.id}`;

      const twilioCall = await twilioClient.calls.create({
        to: phoneNumber,
        from: TWILIO_PHONE_NUMBER,
        url: webhookUrl,
        statusCallback: statusCallbackUrl,
        statusCallbackMethod: "POST",
        statusCallbackEvent: ["completed", "failed", "no-answer", "busy"],
        machineDetection: "DetectMessageEnd",
        asyncAmd: true,
        asyncAmdStatusCallback: statusCallbackUrl,
        asyncAmdStatusCallbackMethod: "POST",
      });

      await supabase.from('call_logs').update({ call_sid: twilioCall.sid }).eq('id', call.id);
      console.log(`  ✓ Call fired: SID ${twilioCall.sid} → ${phoneNumber}`);

      // 6. Auto-schedule next occurrence for recurring calls
      if (call.recurrence && call.recurrence !== "one-time") {
        const nextDate = new Date(call.scheduled_at);
        if (call.recurrence === "weekly") nextDate.setDate(nextDate.getDate() + 7);
        if (call.recurrence === "monthly") nextDate.setDate(nextDate.getDate() + 30);
        
        await supabase.from('call_logs').insert({
          patient_id: call.patient_id,
          scheduled_at: nextDate.toISOString(),
          notes: call.notes,
          status: "scheduled",
          recurrence: call.recurrence,
          override_phone: call.override_phone,
          override_name: call.override_name,
          parent_call_id: call.parent_call_id || call.id,
        });
        console.log(`  ↻ Next ${call.recurrence} call auto-scheduled for ${nextDate.toLocaleString()}`);
      }
    } catch (err) {
      console.error(`  ✗ Failed processing call ${call.id}:`, err.message);
      // ── Retry on transient failures ────────────────────────────
      const { data: freshCall } = await supabase.from('call_logs').select('retry_count').eq('id', call.id).single();
      
      if (freshCall && freshCall.retry_count < 2) {
        const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        await supabase.from('call_logs').update({
          status: "scheduled",
          retry_count: freshCall.retry_count + 1,
          next_retry_at: nextRetryAt,
          scheduled_at: nextRetryAt,
        }).eq('id', call.id);
        console.log(`  ↩ Retry ${freshCall.retry_count + 1}/2 scheduled at ${new Date(nextRetryAt).toLocaleTimeString()}`);
      } else {
        await supabase.from('call_logs').update({ status: 'failed' }).eq('id', call.id);
        console.log(`  ✗ Max retries reached — marked as failed.`);
      }
    }
  }
}

// ─── Entry point ──────────────────────────────────────────────
(async () => {
  console.log("🚀 AmritCare Call Worker starting...");

  // Run immediately on startup, then every 30 seconds
  await processDueCalls();

  cron.schedule("*/30 * * * * *", async () => {
    try {
      await processDueCalls();
    } catch (err) {
      console.error("Worker poll error:", err);
    }
  });

  console.log("⏱️  Polling every 30 seconds. Press Ctrl+C to stop.");
})();
