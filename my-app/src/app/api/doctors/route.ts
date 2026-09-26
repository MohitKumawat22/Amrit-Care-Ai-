import { NextRequest, NextResponse } from"next/server";
import supabase from"@/lib/supabase";

export async function GET() {
 try {
 const { data: profiles, error } = await supabase
 .from("doctor_profiles")
 .select("*, users(name, email)")
 .order("created_at", { ascending: false });

 if (error) {
 console.error("Fetch Doctors Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 // Map to match old format
 const doctors = (profiles || []).map(p => ({
 ...p,
 userId: p.users ? { name: p.users.name, email: p.users.email, _id: p.user_id } : null,
 }));

 return NextResponse.json({ doctors }, { status: 200 });
 } catch (error: any) {
 console.error("Fetch Doctors Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
