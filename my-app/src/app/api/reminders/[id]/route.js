import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { data: reminder, error } = await supabase.from("reminders").select("*").eq("id", id).single();
    if (error || !reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ reminder });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { data: reminder, error } = await supabase.from("reminders").update(body).eq("id", id).select().single();
    if (error || !reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ reminder });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
