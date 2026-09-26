import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import supabase from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "patient") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        *,
        users:doctor_id (
          id,
          name,
          email
        )
      `)
      .eq("patient_id", (session.user as any).id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Format to match old structure if needed
    const formattedAppointments = appointments.map(app => ({
      ...app,
      doctorId: app.users ? {
        _id: app.users.id,
        name: app.users.name,
        email: app.users.email
      } : null
    }));

    return NextResponse.json({ appointments: formattedAppointments }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Patient Appointments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
