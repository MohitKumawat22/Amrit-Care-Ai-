import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { data: updatedAppointment, error } = await supabase
      .from("appointments")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedAppointment) {
      return NextResponse.json({ error: "Appointment not found or failed to update" }, { status: 404 });
    }
    return NextResponse.json(updatedAppointment, { status: 200 });
  } catch (error: any) {
    console.error("PUT Appointment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Appointment not found or failed to delete" }, { status: 404 });
    }
    return NextResponse.json({ message: "Appointment deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE Appointment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
