import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import supabase from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "patient") {
      return NextResponse.json({ error: "Only patients can book appointments" }, { status: 401 });
    }

    const { doctorId, patientInfo, slot } = await req.json();

    if (!doctorId || !patientInfo || !slot) {
      return NextResponse.json({ error: "Missing booking information" }, { status: 400 });
    }

    // 1. Check if the slot is still available and mark it as booked
    const { data: doctorProfile, error: profileError } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("user_id", doctorId)
      .single();

    if (profileError || !doctorProfile) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const availableSlots = doctorProfile.available_slots || [];
    const slotIndex = availableSlots.findIndex(
      (s: any) => s.day === slot.day && s.time === slot.time && !s.isBooked
    );

    if (slotIndex === -1) {
      return NextResponse.json({ error: "Slot no longer available" }, { status: 400 });
    }

    // Mark slot as booked
    availableSlots[slotIndex].isBooked = true;
    
    const { error: updateError } = await supabase
      .from("doctor_profiles")
      .update({ available_slots: availableSlots })
      .eq("id", doctorProfile.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
    }

    // 2. Create the appointment record
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        doctor_id: doctorId,
        patient_id: (session.user as any).id,
        patient_info: patientInfo,
        slot: slot,
        status: "pending",
      })
      .select()
      .single();

    if (appointmentError) {
      return NextResponse.json({ error: appointmentError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Appointment booked", appointment }, { status: 201 });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
