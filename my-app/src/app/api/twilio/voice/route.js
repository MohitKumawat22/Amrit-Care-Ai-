import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

// ─── Severity keyword detection ─────────────────────────────────────────────
const SEVERITY_KEYWORDS = {
  critical: [
    "chest pain", "can't breathe", "heart attack", "stroke", "unconscious",
    "emergency", "chest mein dard", "saans nahi aa raha", "hosh nahi", "bahut bura condition"
  ],
  high: [
    "severe", "hospital", "ambulance", "dizzy", "vomiting",
    "bahut bura lag raha", "chakkar aa raha", "ulti ho rahi", "bahut tez dard"
  ],
  moderate: [
    "pain", "fever", "headache", "nausea", "tired", "weak",
    "dard ho raha", "bukhar hai", "sir dard", "thaka hua", "neend nahi ho rahi"
  ],
  low: [
    "okay", "fine", "better", "good", "theek hoon", "better hoon",
    "sab theek hai", "achha lag raha", "improve hua"
  ],
};

function detectSeverity(transcript) {
  const fullText = transcript
    .map((t) => t.text)
    .join(" ")
    .toLowerCase();

  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some((kw) => fullText.includes(kw))) return level;
  }
  return "info";
}

// ─── Groq AI helpers ──────────────────────────────────────────
async function callGroq(messages, maxTokens = 80) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function buildMidCallSystemPrompt(ctx) {
  const { patient, pastMemories } = ctx || {};
  const firstName = patient?.firstName || "Aap";

  let system = `You are AmritCare, a friendly neighborhood family doctor in a live phone call.
Speak in true Hinglish — 50% English, 50% Hindi mixed naturally per sentence.
Address the patient as ${firstName} with "aap".

Rules:
- Reply in 1-2 sentences only, strictly under 40 words total
- Always acknowledge what the patient said before responding
- If they sound unwell: show concern first, then ask a follow-up question
- If they sound fine: show relief, then ask one gentle follow-up
- Never say "I recommend" or "you should" — use "shayad aap try kar sakte hain" or "ek kaam karein"
- Never diagnose — guide towards seeing a doctor if symptoms are serious
- End with either a question or a warm reassurance — never just stop

Few-shot examples:
Patient says they have a headache: "Achha nahi laga yeh sun ke — sir dard kaafi time se hai ya aaj se shuru hua, ${firstName}?"

Patient says they feel fine: "Yeh sun ke bahut achha laga! Neend aur khana theek se ho raha hai na aapka?"

Patient says they have fever: "Haan, bukhar mein bahut mushkil hoti hai — temperature kitna hai aapka, check kiya?"

Patient says they are very tired: "Samajh aa raha hai, itni thakaan bahut uncomfortable hoti hai. Yeh thakaan kab se feel ho rahi hai aapko?"

Patient says symptoms are getting worse: "Yeh sun ke thoda fikr hui — ek kaam karein, kal doctor se zaroor milein, theek rehna bahut zaroori hai."

Patient says goodbye: "Bilkul, dhyan rakhein apna ${firstName} — koi bhi problem ho toh AmritCare hamesha hai. Take care!"`;

  if (pastMemories?.length) {
    system += `\n\nPrevious call history (use this to follow up naturally):`;
    pastMemories.forEach((m, i) => {
      const mem = m.memory || {};
      system += `\n- Call ${i + 1}: Symptoms: ${(mem.symptoms || []).join(",") || "none"}. Mood: ${mem.mood || "unknown"}. Follow up on: ${(mem.followUpTopics || []).join(",") || "none"}.`;
    });
    system += `\n\nImportant:
- Reference previous symptoms naturally in conversation — do not list them out loud
- Weave follow-ups into the conversation, don't ask them all at once
- If mood was low last time, be extra warm this call
- If symptoms have resolved, express genuine relief`;
  }

  return system;
}

// Build TwiML response — always returns valid XML
function twiml(sayText, gatherActionUrl, timeout = 8) {
  const escaped = sayText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">${escaped}</Say>
  <Gather input="speech" action="${gatherActionUrl}" timeout="15" speechTimeout="3" language="en-IN"/>
  <Say voice="Polly.Aditi">Main aapki awaaz nahi sun saka. Apna khayal rakhein! Alvida.</Say>
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

function twimlEnd(sayText) {
  const escaped = sayText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">${escaped}</Say>
  <Hangup/>
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

// ─── Main webhook handler ──────────────────────────────────────
// Twilio POSTs to this endpoint during a live call
export async function POST(request) {
  try {
    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body));

    const { CallSid, SpeechResult, CallStatus, AnsweredBy } = params;
    console.log(`[Twilio] CallSid=${CallSid} Status=${CallStatus || "voice"} AnsweredBy=${AnsweredBy || "?"} Speech=${SpeechResult ? SpeechResult.substring(0, 60) : "none"}`);

    const ngrokUrl = process.env.NGROK_URL || "";

    // Read callLogId from URL query param (eliminates race condition)
    const { searchParams } = new URL(request.url, "https://placeholder.local");
    const callLogId = searchParams.get("callLogId");
    const webhookUrl = `${ngrokUrl}/api/twilio/voice${callLogId ? "?callLogId=" + callLogId : ""}`;

    // ── 0a. AMD human confirmation callback — ignore, call is already in progress
    // Twilio fires asyncAmdStatusCallback with AnsweredBy=human + CallStatus=in-progress.
    // This is purely informational — return empty TwiML so we don't replay the greeting.
    if (AnsweredBy === "human" && CallStatus === "in-progress") {
      console.log(`[Twilio] AMD human-confirmed callback — ignoring (call already live).`);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response/>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    // ── 0b. Voicemail detection — hang up immediately ────────────────
    if (AnsweredBy === "machine_end_beep" || AnsweredBy === "machine_end_silence" || AnsweredBy === "machine_start") {
      console.log(`[Twilio] Voicemail detected (${AnsweredBy}) — hanging up and scheduling retry.`);

      // Schedule retry via DB
      const { data: vmLog } = await supabase.from('call_logs').select('*').eq('call_sid', CallSid).single();
      if (vmLog) {
        if (vmLog.retry_count < 2) {
          const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          await supabase.from('call_logs').update({ 
            status: "scheduled",
            retry_count: vmLog.retry_count + 1,
            next_retry_at: nextRetryAt,
            scheduled_at: nextRetryAt
          }).eq('id', vmLog.id);
          console.log(`[Twilio] Voicemail retry ${vmLog.retry_count + 1}/2 → ${nextRetryAt}`);
        } else {
          await supabase.from('call_logs').update({ status: "failed" }).eq('id', vmLog.id);
          console.log(`[Twilio] Max retries reached after voicemail — failed.`);
        }
      }

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    // ── 1. Status callback — call ended ──────────────────────────
    if (CallStatus === "completed" || CallStatus === "failed" || CallStatus === "no-answer" || CallStatus === "busy") {
      const { data: callLog } = await supabase.from('call_logs').select('*').eq('call_sid', CallSid).single();
      if (callLog && callLog.status === "in-progress") {

        // ── Handle no-answer / busy with retry ────────────────────────────
        if (CallStatus === "no-answer" || CallStatus === "busy") {
          if (callLog.retry_count < 2) {
            const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            await supabase.from('call_logs').update({ 
              status: "scheduled",
              retry_count: callLog.retry_count + 1,
              next_retry_at: nextRetryAt,
              scheduled_at: nextRetryAt
            }).eq('id', callLog.id);
            console.log(`[Twilio] ${CallStatus} → retry ${callLog.retry_count + 1}/2 at ${nextRetryAt}`);
          } else {
            await supabase.from('call_logs').update({ status: "failed" }).eq('id', callLog.id);
            console.log(`[Twilio] Max retries reached — call marked failed.`);
          }
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?><Response/>`,
            { status: 200, headers: { "Content-Type": "text/xml" } }
          );
        }

        // ── Completed: generate summary + extract memory ───────────────────
        let summary = "";
        let severity = "info";
        let memory = { symptoms: [], mood: null, followUpTopics: [], rawSummary: null };
        const transcript = callLog.transcript || [];

        if (transcript.length > 0) {
          const transcriptText = transcript
            .map((t) => `${t.role === "assistant" ? "AI" : "Patient"}: ${t.text}`)
            .join("\n");

          try {
            summary = await callGroq(
              [
                {
                  role: "system",
                  content: `Summarize this health checkup call in 2-3 sentences in natural Hinglish.
Write it as a warm clinical note — like a family doctor writing a quick update that a caring family member could also understand.
Mention: key symptoms the patient reported, their mood during the call, and whether they need follow-up.
Keep it human, warm, and simple — not a medical report.

Example 1: "Ravi ne aaj sir dard aur thakaan ki baat ki — kaafi dinon se feel ho raha hai unhe. Call ke dauran mood thoda low tha lekin baat karte waqt better laga. Doctor se milna suggest kiya gaya hai agar symptoms kal bhi rahein."

Example 2: "Priya bilkul theek hain — neend aur khana dono sahi chal raha hai. Koi specific symptoms nahi the is call mein, overall mood positive tha. Next checkup regularly schedule karna recommend kiya."`,
                },
                { role: "user", content: transcriptText },
              ],
              150
            );
            memory.rawSummary = summary;
          } catch (e) {
            console.error("Summary generation failed:", e);
            summary = "Summary could not be generated.";
          }

          severity = detectSeverity(transcript);

          // ── Post-call memory extraction ──────────────────────────────
          try {
            const memoryRaw = await callGroq(
              [
                {
                  role: "system",
                  content: `Read this call transcript and extract structured memory for the next call.
Return ONLY a valid JSON object, no extra text:
{
  "symptoms": [], // array of short strings, max 5 words each, in Hinglish
  "mood": "", // one word: positive / low / anxious / neutral / distressed
  "followUpTopics": [] // array of natural Hinglish follow-up questions for next call
}

Keep followUpTopics conversational — phrase them as AmritCare would actually ask them.

Few-shot example output:
{
  "symptoms": ["sir dard", "thakaan", "neend nahi ho rahi"],
  "mood": "low",
  "followUpTopics": [
    "Sir dard better hua kya?",
    "Neend kaisi rahi last few days?",
    "Doctor se mil paaye kya?"
  ]
}`,
                },
                { role: "user", content: transcriptText },
              ],
              200
            );
            const jsonMatch = memoryRaw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              memory.symptoms = parsed.symptoms || [];
              memory.mood = parsed.mood || null;
              memory.followUpTopics = parsed.followUpTopics || [];
            }
            console.log(`[Memory] mood=${memory.mood}, symptoms=${memory.symptoms.join(",")}`);
          } catch (e) {
            console.error("Memory extraction failed:", e);
          }
        }

        await supabase.from('call_logs').update({
          status: "completed",
          summary: summary,
          severity: severity,
          memory: memory
        }).eq('id', callLog.id);

        // Outbound n8n Alert Webhook for critical / high severity
        if (severity === "critical" || severity === "high") {
          try {
            const patientName = callLog.context?.patient?.firstName
              ? `${callLog.context.patient.firstName} ${callLog.context.patient.lastName || ""}`.trim()
              : (callLog.override_name || "Unknown");

            const alertPayload = {
              patientId: callLog.patient_id,
              patientName,
              severity,
              summary,
              doctorId: callLog.context?.patient?.assignedDoctorId || null,
              callSid: callLog.call_sid,
              completedAt: new Date().toISOString(),
            };

            const alertUrl = process.env.N8N_ALERT_WEBHOOK_URL;
            if (alertUrl) {
              fetch(alertUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(alertPayload),
              }).catch((err) => console.error("[n8n Alert Webhook] Dispatch error (non-fatal):", err.message));
            } else {
              console.log("[n8n Alert Webhook] (N8N_ALERT_WEBHOOK_URL unset) Alert payload:", alertPayload);
            }
          } catch (alertErr) {
            console.error("[n8n Alert Webhook] Unexpected error (non-fatal):", alertErr);
          }
        }
      }

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response/>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    // ── 2. Find CallLog — prefer callLogId URL param, fall back to callSid ─
    let callLogQuery;
    if (callLogId) {
      callLogQuery = supabase.from('call_logs').select('*').eq('id', callLogId).single();
    } else {
      callLogQuery = supabase.from('call_logs').select('*').eq('call_sid', CallSid).single();
    }
    const { data: callLogData, error: callLogError } = await callLogQuery;

    if (callLogError || !callLogData) {
      console.error(`[Twilio] CallLog not found (callLogId=${callLogId}, callSid=${CallSid})`);
      return twimlEnd("Namaste! AmritCare se call aa raha tha. Abhi system busy hai, hum baad mein try karenge. Dhanyawad!");
    }
    const callLog = callLogData;
    let transcript = callLog.transcript || [];

    // ── 3. First turn — no SpeechResult yet ──────────────────────
    if (!SpeechResult) {
      const greeting =
        callLog.greeting ||
        `AmritCare ki taraf se call aa raha hai — aapka routine checkup tha aaj. Aap kaisa feel kar rahe hain, sab theek chal raha hai?`;

      return twiml(greeting, webhookUrl);
    }

    // ── 4. Mid-call turn — patient spoke ─────────────────────────
    const patientTurn = {
      role: "patient",
      text: SpeechResult,
      timestamp: new Date().toISOString(),
    };
    transcript.push(patientTurn);

    // Build Groq messages
    const systemPrompt = buildMidCallSystemPrompt(callLog.context);
    const groqMessages = [{ role: "system", content: systemPrompt }];

    for (const turn of transcript) {
      groqMessages.push({
        role: turn.role === "patient" ? "user" : "assistant",
        content: turn.text,
      });
    }

    let aiReply = "Haan, samajh aa raha hai — aur kuch feel ho raha hai aapko, batayein?";
    try {
      aiReply = await callGroq(groqMessages, 80);
    } catch (e) {
      console.error("Mid-call Groq error:", e);
    }

    const asTurn = {
      role: "assistant",
      text: aiReply,
      timestamp: new Date().toISOString(),
    };
    transcript.push(asTurn);
    await supabase.from('call_logs').update({ transcript }).eq('id', callLog.id);

    // Cap conversation at 20 turns to avoid runaway calls
    if (transcript.length >= 20) {
      return twimlEnd(
        `${aiReply} AmritCare AI se baat karke acha laga. Apna khayal rakhein! Alvida.`
      );
    }

    return twiml(aiReply, webhookUrl);
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return twimlEnd("I'm sorry, something went wrong with the AmritCare AI assistant. Please try again later. Goodbye!");
  }
}
