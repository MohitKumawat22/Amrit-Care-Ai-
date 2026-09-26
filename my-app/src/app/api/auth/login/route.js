import { NextResponse } from"next/server";
import bcrypt from"bcryptjs";
import supabase from"@/lib/supabase";

export async function POST(request) {
 try {
 const body = await request.json();
 const { username, password } = body;

 if (!username || !password) {
 return NextResponse.json(
 { error:"Username and password are required." },
 { status: 400 }
 );
 }

 // Find patient by username or email
 const { data: patient, error } = await supabase
 .from("patients")
 .select("*")
 .or(`username.eq.${username.toLowerCase()},email.eq.${username.toLowerCase()}`)
 .single();

 if (error || !patient) {
 return NextResponse.json(
 { error:"No account found with this username or email." },
 { status: 404 }
 );
 }

 // Compare password
 const isMatch = await bcrypt.compare(password, patient.password);
 if (!isMatch) {
 return NextResponse.json(
 { error:"Invalid password. Please try again." },
 { status: 401 }
 );
 }

 return NextResponse.json({
 message:"Login successful",
 patient: {
 id: patient.id,
 firstName: patient.first_name,
 lastName: patient.last_name,
 email: patient.email,
 username: patient.username,
 phone: patient.phone,
 age: patient.age,
 blood: patient.blood,
 createdAt: patient.created_at,
 },
 });
 } catch (error) {
 console.error("Login error:", error);
 return NextResponse.json(
 { error:"Internal server error. Please try again." },
 { status: 500 }
 );
 }
}
