import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: profile, error } = await supabase
      .from("doctor_profiles")
      .select("available_slots")
      .eq("user_id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const availableSlotsRaw = profile.available_slots || [];
    // Filter slots that are NOT booked
    const availableSlots = availableSlotsRaw.filter((slot: any) => !slot.isBooked);

    return NextResponse.json({ availableSlots }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Slots Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
