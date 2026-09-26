import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";

// GET /api/calls?patientId=xxx — fetch patient's call history
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required." },
        { status: 400 }
      );
    }

    const calls = await CallLog.find({ patientId })
      .sort({ scheduledAt: -1 })
      .select("-context -transcript") // Keep response light; expand only when needed
      .lean();

    return NextResponse.json({ calls });
  } catch (error) {
    console.error("GET /api/calls error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls." },
      { status: 500 }
    );
  }
}

// POST /api/calls — schedule a new call
// Body: { patientId, scheduledAt, notes?, recurrence?, overridePhone?, overrideName? }
export async function POST(request) {
  try {
    await connectDB();
    const {
      patientId,
      scheduledAt,
      notes,
      recurrence,
      overridePhone,
      overrideName,
    } = await request.json();

    if (!patientId || !scheduledAt) {
      return NextResponse.json(
        { error: "patientId and scheduledAt are required." },
        { status: 400 }
      );
    }

    const scheduled = new Date(scheduledAt);
    if (scheduled <= new Date()) {
      return NextResponse.json(
        { error: "scheduledAt must be a future date/time." },
        { status: 400 }
      );
    }

    // Check Twilio configuration — warn but don't block scheduling
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

    const callLog = await CallLog.create({
      patientId,
      scheduledAt: scheduled,
      notes: notes || "",
      status: "scheduled",
      recurrence: recurrence || "one-time",
      overridePhone: overridePhone || null,
      overrideName: overrideName || null,
    });

    return NextResponse.json(
      {
        call: callLog,
        twilioConfigured: !!twilioConfigured,
        warning: twilioConfigured
          ? null
          : "Call saved successfully, but AI phone calls are not configured yet. " +
            "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and NGROK_URL " +
            "to your .env.local to enable live calls.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/calls error:", error);
    return NextResponse.json(
      { error: "Failed to schedule call." },
      { status: 500 }
    );
  }
}

// DELETE /api/calls?id=xxx — cancel a scheduled call
export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const call = await CallLog.findById(id);
    if (!call) {
      return NextResponse.json({ error: "Call not found." }, { status: 404 });
    }

    if (call.status !== "scheduled") {
      return NextResponse.json(
        { error: `Cannot cancel a call with status '${call.status}'.` },
        { status: 400 }
      );
    }

    call.status = "cancelled";
    await call.save();

    return NextResponse.json({ success: true, call });
  } catch (error) {
    console.error("DELETE /api/calls error:", error);
    return NextResponse.json(
      { error: "Failed to cancel call." },
      { status: 500 }
    );
  }
}
