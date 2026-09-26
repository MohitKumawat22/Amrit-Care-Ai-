import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

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

    let updatedDoc: any = null;
    let docType = "";

    // Case 1: Reminder update
    if (target === "Reminder" || target === "reminder" || reminderId) {
      docType = "Reminder";
      const { data: reminder, error: fetchErr } = await supabase.from("reminders").select("*").eq("id", targetId).single();
      
      if (fetchErr || !reminder) {
        return NextResponse.json({ error: `Reminder not found with id ${targetId}` }, { status: 404 });
      }

      const updates: any = {};
      
      // If callback reports medicine was marked taken via WhatsApp / n8n button
      if (status === "taken" || action === "mark_taken") {
        updates.remaining_quantity = Math.max(0, reminder.remaining_quantity - (reminder.tablets_per_dose || 1));
        
        const takenLog = reminder.taken_log || [];
        takenLog.push({
          scheduledTime: new Date().toISOString(),
          takenAt: new Date().toISOString(),
          status: "taken",
          quantityConsumed: reminder.tablets_per_dose || 1,
        });
        updates.taken_log = takenLog;
      }

      if (message) {
        updates.notes = reminder.notes
          ? `${reminder.notes} | [n8n]: ${message}`
          : `[n8n]: ${message}`;
      }

      if (Object.keys(updates).length > 0) {
        const { data: updated, error: updateErr } = await supabase.from("reminders").update(updates).eq("id", targetId).select().single();
        if (updateErr) throw updateErr;
        updatedDoc = updated;
      } else {
        updatedDoc = reminder;
      }
    }
    // Case 2: CallLog / Alert update
    else if (target === "CallLog" || target === "call" || target === "alert" || callId || callLogId) {
      docType = "CallLog";
      const { data: callLog, error: fetchErr } = await supabase.from("call_logs").select("*").eq("id", targetId).single();
      
      if (fetchErr || !callLog) {
        return NextResponse.json({ error: `CallLog not found with id ${targetId}` }, { status: 404 });
      }

      const updates: any = {};

      if (status) {
        updates.notes = callLog.notes
          ? `${callLog.notes} | [n8n Status: ${status}]`
          : `[n8n Status: ${status}]`;
      }

      if (acknowledgedBy) {
        updates.notes = `${updates.notes || callLog.notes || ""} | [Ack by: ${acknowledgedBy}]`;
      }

      if (message) {
        updates.notes = `${updates.notes || callLog.notes || ""} | [n8n]: ${message}`;
      }

      if (Object.keys(updates).length > 0) {
        const { data: updated, error: updateErr } = await supabase.from("call_logs").update(updates).eq("id", targetId).select().single();
        if (updateErr) throw updateErr;
        updatedDoc = updated;
      } else {
        updatedDoc = callLog;
      }
    } else {
      // Fallback: try finding in Reminder then CallLog
      const { data: reminder } = await supabase.from("reminders").select("*").eq("id", targetId).single();
      if (reminder) {
        docType = "Reminder";
        if (message) {
          const notes = `${reminder.notes || ""} | [n8n]: ${message}`;
          const { data: updated } = await supabase.from("reminders").update({ notes }).eq("id", targetId).select().single();
          updatedDoc = updated;
        } else {
          updatedDoc = reminder;
        }
      } else {
        const { data: callLog } = await supabase.from("call_logs").select("*").eq("id", targetId).single();
        if (callLog) {
          docType = "CallLog";
          if (message) {
            const notes = `${callLog.notes || ""} | [n8n]: ${message}`;
            const { data: updated } = await supabase.from("call_logs").update({ notes }).eq("id", targetId).select().single();
            updatedDoc = updated;
          } else {
            updatedDoc = callLog;
          }
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
