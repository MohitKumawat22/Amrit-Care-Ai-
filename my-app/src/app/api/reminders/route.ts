import { NextRequest, NextResponse } from"next/server";
import supabase from"@/lib/supabase";

export async function GET(request: NextRequest) {
 try {
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");

 let query = supabase
 .from("reminders")
 .select("*")
 .eq("is_active", true)
 .order("created_at", { ascending: false });

 if (patientId) {
 query = query.eq("patient_id", patientId);
 }

 const { data: reminders, error } = await query;

 if (error) {
 console.error("GET Reminders Error:", error);
 return NextResponse.json({ error:"Failed to fetch reminders" }, { status: 500 });
 }

 // Map snake_case DB columns to camelCase for frontend compatibility
 const mapped = (reminders || []).map(r => ({
 _id: r.id,
 patientId: r.patient_id,
 patientName: r.patient_name,
 medicineName: r.medicine_name,
 medicineType: r.medicine_type,
 dosage: r.dosage,
 frequency: r.frequency,
 times: r.times || [],
 specificDays: r.specific_days || [],
 startDate: r.start_date,
 totalQuantity: r.total_quantity,
 remainingQuantity: r.remaining_quantity,
 tabletsPerDose: r.tablets_per_dose,
 refillAlertDays: r.refill_alert_days,
 isActive: r.is_active,
 takenLog: r.taken_log || [],
 notes: r.notes,
 createdAt: r.created_at,
 updatedAt: r.updated_at,
 }));

 return NextResponse.json({ reminders: mapped }, { status: 200 });
 } catch (error) {
 console.error("GET Reminders Error:", error);
 return NextResponse.json({ error:"Failed to fetch reminders" }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
 const body = await request.json();

    const { data: newReminder, error } = await supabase
      .from("reminders")
      .insert({
        patient_id: body.patientId,
        patient_name: body.patientName,
        medicine_name: body.medicineName,
        medicine_type: body.medicineType || "tablet",
        dosage: body.dosage,
        frequency: body.frequency,
        times: body.times || [],
        specific_days: body.specificDays || [],
        start_date: body.startDate || new Date().toISOString(),
        total_quantity: body.totalQuantity ?? 30,
        remaining_quantity: body.totalQuantity ?? 30,
        tablets_per_dose: body.tabletsPerDose || 1,
        refill_alert_days: body.refillAlertDays || 2,
        is_active: true,
        taken_log: [],
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("POST Reminder Error:", error);
      return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
    }

    const mapped = {
      _id: newReminder.id,
      patientId: newReminder.patient_id,
      medicineName: newReminder.medicine_name,
      dosage: newReminder.dosage,
      times: newReminder.times,
      createdAt: newReminder.created_at,
    };

    // Outbound n8n Reminder Webhook (non-blocking)
    try {
      const payload = {
        patientId: newReminder.patient_id,
        medicineName: newReminder.medicine_name,
        dosage: newReminder.dosage,
        phone: body.phone || "",
        scheduledTime: newReminder.times?.[0] || new Date().toISOString(),
        reminderId: newReminder.id,
        createdAt: new Date().toISOString(),
      };

      const webhookUrl = process.env.N8N_REMINDER_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => console.error("[n8n Reminder Webhook] Dispatch error (non-fatal):", err.message));
      }
    } catch (whErr) {
      console.error("[n8n Reminder Webhook] Unexpected error (non-fatal):", whErr);
    }

    return NextResponse.json({ reminder: mapped }, { status: 201 });
  } catch (error) {
    console.error("POST Reminder Error:", error);
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
