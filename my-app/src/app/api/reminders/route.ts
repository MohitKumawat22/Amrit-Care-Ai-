import { NextRequest, NextResponse } from"next/server";
import connectDB from"@/lib/mongodb";
import Reminder from"@/models/Reminder";

export async function GET(request: NextRequest) {
 try {
 await connectDB();
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");
 const query: any = { isActive: true };
 if (patientId) query.patientId = patientId;

 const reminders = await Reminder.find(query).sort({ createdAt: -1 });
 return NextResponse.json({ reminders }, { status: 200 });
 } catch (error) {
 console.error("GET Reminders Error:", error);
 return NextResponse.json({ error:"Failed to fetch reminders" }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
 await connectDB();
 const body = await request.json();

    // Automatically set remainingQuantity equal to totalQuantity
    const newReminder = await Reminder.create({
      ...body,
      remainingQuantity: body.totalQuantity ?? 30,
    });

    // Outbound n8n Reminder Webhook (non-blocking)
    try {
      const payload = {
        patientId: newReminder.patientId,
        medicineName: newReminder.medicineName,
        dosage: newReminder.dosage,
        phone: body.phone || "",
        scheduledTime: newReminder.times?.[0] || new Date().toISOString(),
        reminderId: newReminder._id,
        createdAt: new Date().toISOString(),
      };

      const webhookUrl = process.env.N8N_REMINDER_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => console.error("[n8n Reminder Webhook] Dispatch error (non-fatal):", err.message));
      } else {
        console.log("[n8n Reminder Webhook] (N8N_REMINDER_WEBHOOK_URL unset) Reminder payload:", payload);
      }
    } catch (whErr) {
      console.error("[n8n Reminder Webhook] Unexpected error (non-fatal):", whErr);
    }

    return NextResponse.json({ reminder: newReminder }, { status: 201 });
  } catch (error) {
    console.error("POST Reminder Error:", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
