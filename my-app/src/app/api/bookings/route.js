import { NextResponse } from"next/server";
import supabase from"@/lib/supabase";

// GET — Fetch all bookings for a patient
export async function GET(request) {
 try {
 const { searchParams } = new URL(request.url);
 const patientId = searchParams.get("patientId");

 if (!patientId) {
 return NextResponse.json({ error:"patientId is required." }, { status: 400 });
 }

 const { data: bookings, error } = await supabase
 .from("bookings")
 .select("*")
 .eq("patient_id", patientId)
 .order("created_at", { ascending: false });

 if (error) {
 console.error("Booking fetch error:", error);
 return NextResponse.json({ error:"Failed to fetch bookings." }, { status: 500 });
 }

 // Map to camelCase for frontend
 const mapped = (bookings || []).map(b => ({
 _id: b.id,
 patientId: b.patient_id,
 facilityName: b.facility_name,
 address: b.address,
 department: b.department,
 status: b.status,
 scheduledDate: b.scheduled_date,
 scheduledSlot: b.scheduled_slot,
 fee: b.fee,
 createdAt: b.created_at,
 }));

 return NextResponse.json({ bookings: mapped });
 } catch (error) {
 console.error("Booking fetch error:", error);
 return NextResponse.json({ error:"Failed to fetch bookings." }, { status: 500 });
 }
}

// POST — Save a new booking
export async function POST(request) {
 try {
 const body = await request.json();
 const { patientId, facilityName, address, lat, lng, rating, placeId, department, status, notes, scheduledDate, scheduledSlot, fee } = body;

 if (!patientId || !facilityName) {
 return NextResponse.json({ error:"patientId and facilityName are required." }, { status: 400 });
 }

 const { data: booking, error } = await supabase
 .from("bookings")
 .insert({
 patient_id: patientId,
 facility_name: facilityName,
 address: address || "",
 lat: lat || null,
 lng: lng || null,
 rating: rating || null,
 place_id: placeId || "",
 department: department || "General",
 status: status || "upcoming",
 notes: notes || "",
 scheduled_date: scheduledDate || null,
 scheduled_slot: scheduledSlot || "",
 fee: fee || "0",
 })
 .select()
 .single();

 if (error) {
 console.error("Booking save error:", error);
 return NextResponse.json({ error:"Failed to save booking." }, { status: 500 });
 }

 return NextResponse.json(
 { message:"Booking saved", booking: { _id: booking.id, ...booking } },
 { status: 201 }
 );
 } catch (error) {
 console.error("Booking save error:", error);
 return NextResponse.json({ error:"Failed to save booking." }, { status: 500 });
 }
}
