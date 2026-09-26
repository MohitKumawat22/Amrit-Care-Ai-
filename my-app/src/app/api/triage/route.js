import { NextResponse } from"next/server";
import supabase from"@/lib/supabase";

// GET — Fetch all triage sessions for a patient
export async function GET(request) {
 try {
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");

 if (!patientId) {
 return NextResponse.json({ error:"patientId is required." }, { status: 400 });
 }

 const { data: triages, error } = await supabase
 .from("triages")
 .select("*")
 .eq("patient_id", patientId)
 .order("created_at", { ascending: false });

 if (error) {
 console.error("Triage fetch error:", error);
 return NextResponse.json({ error:"Failed to fetch triage history." }, { status: 500 });
 }

 const mapped = (triages || []).map(t => ({
 _id: t.id,
 patientId: t.patient_id,
 title: t.title,
 severity: t.severity,
 symptoms: t.symptoms || [],
 transcript: t.transcript || [],
 recommendation: t.recommendation,
 lang: t.lang,
 createdAt: t.created_at,
 }));

 return NextResponse.json({ triages: mapped });
 } catch (error) {
 console.error("Triage fetch error:", error);
 return NextResponse.json({ error:"Failed to fetch triage history." }, { status: 500 });
 }
}

// POST — Save a new triage session
export async function POST(request) {
 try {
 const body = await request.json();
 const { patientId, title, severity, symptoms, transcript, recommendation, lang } = body;

 if (!patientId) {
 return NextResponse.json({ error:"patientId is required." }, { status: 400 });
 }

 const { data: triage, error } = await supabase
 .from("triages")
 .insert({
 patient_id: patientId,
 title: title || "AI Triage Session",
 severity: severity || "info",
 symptoms: symptoms || [],
 transcript: transcript || [],
 recommendation: recommendation || "",
 lang: lang || "en",
 })
 .select()
 .single();

 if (error) {
 console.error("Triage save error:", error);
 return NextResponse.json({ error:"Failed to save triage session." }, { status: 500 });
 }

 return NextResponse.json(
 { message:"Triage session saved", triage: { _id: triage.id, ...triage } },
 { status: 201 }
 );
 } catch (error) {
 console.error("Triage save error:", error);
 return NextResponse.json({ error:"Failed to save triage session." }, { status: 500 });
 }
}
