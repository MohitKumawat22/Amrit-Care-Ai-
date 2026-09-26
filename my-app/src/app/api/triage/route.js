import { NextResponse } from"next/server";
import connectDB from"@/lib/mongodb";
import Triage from"@/models/Triage";

// GET — Fetch all triage sessions for a patient
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

 const triages = await Triage.find({ patientId })
 .sort({ createdAt: -1 })
 .lean();

 return NextResponse.json({ triages });
 } catch (error) {
 console.error("Triage fetch error:", error);
 return NextResponse.json(
 { error:"Failed to fetch triage history." },
 { status: 500 }
 );
 }
}

// POST — Save a new triage session
export async function POST(request) {
 try {
 await connectDB();
 const body = await request.json();

 const { patientId, title, severity, symptoms, transcript, recommendation, lang } = body;

 if (!patientId) {
 return NextResponse.json(
 { error:"patientId is required." },
 { status: 400 }
 );
 }

 const triage = await Triage.create({
 patientId,
 title: title ||"AI Triage Session",
 severity: severity ||"info",
 symptoms: symptoms || [],
 transcript: transcript || [],
 recommendation: recommendation ||"",
 lang: lang ||"en",
 });

 return NextResponse.json(
 { message:"Triage session saved", triage },
 { status: 201 }
 );
 } catch (error) {
 console.error("Triage save error:", error);
 return NextResponse.json(
 { error:"Failed to save triage session." },
 { status: 500 }
 );
 }
}
