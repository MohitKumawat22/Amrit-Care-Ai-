import { NextResponse } from"next/server";
import connectDB from"@/lib/mongodb";
import Patient from"@/models/Patient";

// GET — Fetch patient profile
export async function GET(request) {
 try {
 await connectDB();
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");

 if (!patientId) {
 return NextResponse.json(
 { error:"patientId is required." },
 { status: 400 }
 );
 }

 const patient = await Patient.findById(patientId)
 .select("-password")
 .lean();

 if (!patient) {
 return NextResponse.json(
 { error:"Patient not found." },
 { status: 404 }
 );
 }

 return NextResponse.json({ patient });
 } catch (error) {
 console.error("Profile fetch error:", error);
 return NextResponse.json(
 { error:"Failed to fetch patient profile." },
 { status: 500 }
 );
 }
}
