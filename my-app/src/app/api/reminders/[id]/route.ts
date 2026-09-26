import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { data: reminder, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const mapped = {
      _id: reminder.id,
      patientId: reminder.patient_id,
      medicineName: reminder.medicine_name,
      medicineType: reminder.medicine_type,
      dosage: reminder.dosage,
      frequency: reminder.frequency,
      times: reminder.times || [],
      totalQuantity: reminder.total_quantity,
      remainingQuantity: reminder.remaining_quantity,
      tabletsPerDose: reminder.tablets_per_dose,
      refillAlertDays: reminder.refill_alert_days,
      isActive: reminder.is_active,
      takenLog: reminder.taken_log || [],
      notes: reminder.notes,
      createdAt: reminder.created_at,
    };

    return NextResponse.json({ reminder: mapped }, { status: 200 });
  } catch (error) {
    console.error("GET Single Reminder Error:", error);
    return NextResponse.json({ error: "Failed to fetch reminder" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Map camelCase input to snake_case columns
    const updateData: any = {};
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.medicineName) updateData.medicine_name = body.medicineName;
    if (body.dosage) updateData.dosage = body.dosage;
    if (body.frequency) updateData.frequency = body.frequency;
    if (body.times) updateData.times = body.times;
    if (body.totalQuantity !== undefined) updateData.total_quantity = body.totalQuantity;
    if (body.remainingQuantity !== undefined) updateData.remaining_quantity = body.remainingQuantity;
    if (body.tabletsPerDose !== undefined) updateData.tablets_per_dose = body.tabletsPerDose;
    if (body.notes !== undefined) updateData.notes = body.notes;
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("reminders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ reminder: { _id: updated.id, ...updated } }, { status: 200 });
  } catch (error) {
    console.error("PUT Reminder Error:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { error, count } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete reminder", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Reminder permanently deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE Reminder Error:", error);
    return NextResponse.json({ error: "Failed to delete reminder", details: error.message }, { status: 500 });
  }
}
