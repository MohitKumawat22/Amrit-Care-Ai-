import { NextResponse } from"next/server";
import bcrypt from"bcryptjs";
import connectDB from"@/lib/mongodb";
import Patient from"@/models/Patient";

export async function POST(request) {
 try {
 await connectDB();
 const body = await request.json();

 const { username, password } = body;

 if (!username || !password) {
 return NextResponse.json(
 { error:"Username and password are required." },
 { status: 400 }
 );
 }

 // Find patient by username or email
 const patient = await Patient.findOne({
 $or: [
 { username: username.toLowerCase() },
 { email: username.toLowerCase() },
 ],
 });

 if (!patient) {
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
 id: patient._id,
 firstName: patient.firstName,
 lastName: patient.lastName,
 email: patient.email,
 username: patient.username,
 phone: patient.phone,
 age: patient.age,
 blood: patient.blood,
 createdAt: patient.createdAt,
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
