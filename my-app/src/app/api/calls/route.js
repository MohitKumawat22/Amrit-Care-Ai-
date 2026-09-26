import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

// GET /api/calls?patientId=xxx — fetch patient's call history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required." }, { status: 400 });
    }

    const { data: calls, error } = await supabase
      .from("call_logs")
      .select("id, patient_id, scheduled_at, status, call_sid, retry_count, severity, notes, recurrence, override_phone, override_name, memory, created_at")
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("GET /api/calls error:", error);
      return NextResponse.json({ error: "Failed to fetch calls." }, { status: 500 });
    }

    // Map to camelCase
    const mapped = (calls || []).map(c => ({
      _id: c.id,
      patientId: c.patient_id,
      scheduledAt: c.scheduled_at,
      status: c.status,
      callSid: c.call_sid,
      severity: c.severity,
      notes: c.notes,
      recurrence: c.recurrence,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ calls: mapped });
  } catch (error) {
    console.error("GET /api/calls error:", error);
    return NextResponse.json({ error: "Failed to fetch calls." }, { status: 500 });
  }
}

// POST /api/calls — schedule a new call
export async function POST(request) {
  try {
    const { patientId, scheduledAt, notes, recurrence, overridePhone, overrideName } = await request.json();

    if (!patientId || !scheduledAt) {
      return NextResponse.json({ error: "patientId and scheduledAt are required." }, { status: 400 });
    }

    const scheduled = new Date(scheduledAt);
    if (scheduled <= new Date()) {
      return NextResponse.json({ error: "scheduledAt must be a future date/time." }, { status: 400 });
    }

    const twilioConfigured =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER &&
      process.env.NGROK_URL;

    if (!twilioConfigured) {
      console.warn(
        "⚠️  [Calls] Twilio is not configured. The call will be saved as 'scheduled' " +
        "but will NOT fire until TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, " +
        "and NGROK_URL are all set in .env.local, and the call-worker.js process is running."
      );
    }

    const { data: callLog, error } = await supabase
      .from("call_logs")
      .insert({
        patient_id: patientId,
        scheduled_at: scheduled.toISOString(),
        notes: notes || "",
        status: "scheduled",
        recurrence: recurrence || "one-time",
        override_phone: overridePhone || null,
        override_name: overrideName || null,
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/calls error:", error);
      return NextResponse.json({ error: "Failed to schedule call." }, { status: 500 });
    }

    return NextResponse.json(
      {
        call: { _id: callLog.id, ...callLog },
        twilioConfigured: !!twilioConfigured,
        warning: twilioConfigured
          ? null
          : "Call saved successfully, but AI phone calls are not configured yet.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/calls error:", error);
    return NextResponse.json({ error: "Failed to schedule call." }, { status: 500 });
  }
}

// DELETE /api/calls?id=xxx — cancel a scheduled call
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const { data: call, error: fetchErr } = await supabase
      .from("call_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !call) {
      return NextResponse.json({ error: "Call not found." }, { status: 404 });
    }

    if (call.status !== "scheduled") {
      return NextResponse.json(
        { error: `Cannot cancel a call with status '${call.status}'.` },
        { status: 400 }
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from("call_logs")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: "Failed to cancel call." }, { status: 500 });
    }

    return NextResponse.json({ success: true, call: updated });
  } catch (error) {
    console.error("DELETE /api/calls error:", error);
    return NextResponse.json({ error: "Failed to cancel call." }, { status: 500 });
  }
}
