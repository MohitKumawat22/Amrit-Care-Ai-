import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import supabase from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { specialty, hospital, bio, photo, availableSlots } = await req.json();
    const userId = (session.user as any).id;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    let updatedProfile;

    if (existingProfile) {
      const { data, error } = await supabase
        .from("doctor_profiles")
        .update({
          specialty,
          hospital,
          bio,
          photo,
          available_slots: availableSlots,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingProfile.id)
        .select()
        .single();
      
      if (error) throw error;
      updatedProfile = data;
    } else {
      const { data, error } = await supabase
        .from("doctor_profiles")
        .insert({
          user_id: userId,
          specialty,
          hospital,
          bio,
          photo,
          available_slots: availableSlots,
        })
        .select()
        .single();
      
      if (error) throw error;
      updatedProfile = data;
    }

    // Format output to match old structure if needed
    const formattedProfile = {
      ...updatedProfile,
      availableSlots: updatedProfile.available_slots
    };

    return NextResponse.json({ message: "Profile updated", profile: formattedProfile }, { status: 200 });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
