import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import Reminder from "@/models/Reminder";

/**
 * Inbound webhook receiver for n8n automation callbacks.
 * E.g., "WhatsApp delivery confirmed", "Caregiver alert acknowledged", "Reminder response received"
 *
 * Protected with a shared secret header (x-n8n-secret or Authorization: Bearer <secret>).
 */
export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.N8N_CALLBACK_SECRET;

    // Validate shared secret
    const headerSecret =
      req.headers.get("x-n8n-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";

    if (configuredSecret && headerSecret !== configuredSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing secret token" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { target, id, reminderId, callId, callLogId, status, message, acknowledgedBy, action } = body;

    const targetId = id || reminderId || callId || callLogId;
    if (!targetId) {
      return NextResponse.json(
        { error: "Missing required identifier (id, reminderId, or callId)" },
        { status: 400 }
      );
    }

    await connectDB();
    let updatedDoc: any = null;
    let docType = "";

    // Case 1: Reminder update
    if (target === "Reminder" || target === "reminder" || reminderId) {
      docType = "Reminder";
      const reminder = await Reminder.findById(targetId);
      if (!reminder) {
        return NextResponse.json({ error: `Reminder not found with id ${targetId}` }, { status: 404 });
      }

      // If callback reports medicine was marked taken via WhatsApp / n8n button
      if (status === "taken" || action === "mark_taken") {
        reminder.remainingQuantity = Math.max(0, reminder.remainingQuantity - (reminder.tabletsPerDose || 1));
        reminder.takenLog.push({
          scheduledTime: new Date(),
          takenAt: new Date(),
          status: "taken",
          quantityConsumed: reminder.tabletsPerDose || 1,
        });
      }

      if (message) {
        reminder.notes = reminder.notes
          ? `${reminder.notes} | [n8n]: ${message}`
          : `[n8n]: ${message}`;
      }

      await reminder.save();
      updatedDoc = reminder;
    }
    // Case 2: CallLog / Alert update
    else if (target === "CallLog" || target === "call" || target === "alert" || callId || callLogId) {
      docType = "CallLog";
      const callLog = await CallLog.findById(targetId);
      if (!callLog) {
        return NextResponse.json({ error: `CallLog not found with id ${targetId}` }, { status: 404 });
      }

      if (status) {
        callLog.notes = callLog.notes
          ? `${callLog.notes} | [n8n Status: ${status}]`
          : `[n8n Status: ${status}]`;
      }

      if (acknowledgedBy) {
        callLog.notes = `${callLog.notes || ""} | [Ack by: ${acknowledgedBy}]`;
      }

      if (message) {
        callLog.notes = `${callLog.notes || ""} | [n8n]: ${message}`;
      }

      await callLog.save();
      updatedDoc = callLog;
    } else {
      // Fallback: try finding in Reminder then CallLog
      const reminder = await Reminder.findById(targetId);
      if (reminder) {
        docType = "Reminder";
        if (message) reminder.notes = `${reminder.notes || ""} | [n8n]: ${message}`;
        await reminder.save();
        updatedDoc = reminder;
      } else {
        const callLog = await CallLog.findById(targetId);
        if (callLog) {
          docType = "CallLog";
          if (message) callLog.notes = `${callLog.notes || ""} | [n8n]: ${message}`;
          await callLog.save();
          updatedDoc = callLog;
        } else {
          return NextResponse.json({ error: `Document not found with id ${targetId}` }, { status: 404 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${docType} successfully from n8n callback`,
      updated: updatedDoc,
    });
  } catch (error: any) {
    console.error("Inbound n8n callback error:", error);
    return NextResponse.json(
      { error: "Failed to process n8n callback", details: error.message },
      { status: 500 }
    );
  }
}
