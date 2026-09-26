import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import supabase from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        *,
        patients:patient_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("doctor_id", (session.user as any).id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Format to match old structure if needed
    const formattedAppointments = appointments.map(app => ({
      ...app,
      patientId: app.patients ? {
        _id: app.patients.id,
        name: `${app.patients.first_name} ${app.patients.last_name}`,
        email: app.patients.email
      } : null
    }));

    return NextResponse.json({ appointments: formattedAppointments }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Doctor Appointments Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
