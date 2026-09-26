import { NextResponse } from"next/server";
import connectDB from"@/lib/mongodb";
import MedicineReminder from"@/models/MedicineReminder";

// GET — Fetch all reminders for a patient
export async function GET(request) {
 try {
 await connectDB();
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");

 if (!patientId) {
 return NextResponse.json(
 { error:"patientId is required." },
 { status: 400 }
 );
 }

 const reminders = await MedicineReminder.find({ patientId })
 .sort({ time: 1 })
 .lean();

 return NextResponse.json({ reminders });
 } catch (error) {
 console.error("Reminder fetch error:", error);
 return NextResponse.json(
 { error:"Failed to fetch reminders." },
 { status: 500 }
 );
 }
}

// POST — Create a new reminder
export async function POST(request) {
 try {
 await connectDB();
 const body = await request.json();

 const { patientId, medicineName, time, frequency } = body;

 if (!patientId || !medicineName || !time) {
 return NextResponse.json(
 { error:"Missing required fields." },
 { status: 400 }
 );
 }

    const reminder = await MedicineReminder.create({
      patientId,
      medicineName,
      time,
      frequency: frequency || "daily",
      isActive: true,
    });

    // Outbound n8n Reminder Webhook (non-blocking)
    try {
      const payload = {
        patientId,
        medicineName,
        dosage: body.dosage || "1 dose",
        phone: body.phone || "",
        scheduledTime: time,
        reminderId: reminder._id,
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

    return NextResponse.json(
      { message: "Reminder created", reminder },
      { status: 201 }
    );
 } catch (error) {
 console.error("Reminder create error:", error);
 return NextResponse.json(
 { error:"Failed to create reminder." },
 { status: 500 }
 );
 }
}

// DELETE — Remove a reminder
export async function DELETE(request) {
 try {
 await connectDB();
 const { searchParams } = new URL(request.url);
 const id = searchParams.get("id");

 if (!id) {
 return NextResponse.json({ error:"ID is required" }, { status: 400 });
 }

 await MedicineReminder.findByIdAndDelete(id);

 return NextResponse.json({ message:"Reminder deleted" });
 } catch (error) {
 console.error("Reminder delete error:", error);
 return NextResponse.json(
 { error:"Failed to delete reminder." },
 { status: 500 }
 );
 }
}

// PATCH — Toggle active status
export async function PATCH(request) {
 try {
 await connectDB();
 const body = await request.json();
 const { id, isActive } = body;

 if (!id) {
 return NextResponse.json({ error:"ID is required" }, { status: 400 });
 }

 const reminder = await MedicineReminder.findByIdAndUpdate(
 id,
 { isActive },
 { new: true }
 );

 return NextResponse.json({ message:"Reminder updated", reminder });
 } catch (error) {
 console.error("Reminder update error:", error);
 return NextResponse.json(
 { error:"Failed to update reminder." },
 { status: 500 }
 );
 }
}
