import { NextRequest, NextResponse } from"next/server";
import supabase from"@/lib/supabase";

export async function GET(request: NextRequest) {
 try {
 const { searchParams } = new URL(request.url);
 const search = searchParams.get("search");

 let query = supabase
 .from("patients")
 .select("*")
 .order("created_at", { ascending: false });

 if (search) {
 query = query.or(
 `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
 );
 }

 const { data: patients, error } = await query;

 if (error) {
 console.error("GET Patients Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 // Map to camelCase
 const mapped = (patients || []).map(p => ({
 _id: p.id,
 firstName: p.first_name,
 lastName: p.last_name,
 email: p.email,
 phone: p.phone,
 username: p.username,
 age: p.age,
 blood: p.blood,
 createdAt: p.created_at,
 }));

 return NextResponse.json({ patients: mapped }, { status: 200 });
 } catch (error: any) {
 console.error("GET Patients Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
 const body = await request.json();
 const { data: newPatient, error } = await supabase
 .from("patients")
 .insert({
 first_name: body.firstName,
 last_name: body.lastName,
 email: body.email,
 phone: body.phone,
 username: body.username,
 password: body.password,
 age: body.age,
 blood: body.blood,
 })
 .select()
 .single();

 if (error) {
 console.error("POST Patient Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json(newPatient, { status: 201 });
 } catch (error: any) {
 console.error("POST Patient Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
