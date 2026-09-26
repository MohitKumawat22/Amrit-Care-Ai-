import { NextResponse } from"next/server";
import connectDB from "@/lib/mongodb";
import Booking from"@/models/Booking";

// GET — Fetch all bookings for a patient
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

 const bookings = await Booking.find({ patientId })
 .sort({ createdAt: -1 })
 .lean();

 return NextResponse.json({ bookings });
 } catch (error) {
 console.error("Booking fetch error:", error);
 return NextResponse.json(
 { error:"Failed to fetch bookings." },
 { status: 500 }
 );
 }
}

// POST — Save a new booking
export async function POST(request) {
 try {
 await connectDB();
 const body = await request.json();

 const { patientId, facilityName, address, lat, lng, rating, placeId, department, status, notes, scheduledDate, scheduledSlot, fee } = body;

 if (!patientId || !facilityName) {
 return NextResponse.json(
 { error:"patientId and facilityName are required." },
 { status: 400 }
 );
 }

 const booking = await Booking.create({
 patientId,
 facilityName,
 address: address ||"",
 lat: lat || null,
 lng: lng || null,
 rating: rating || null,
 placeId: placeId ||"",
 department: department ||"General",
 status: status ||"upcoming",
 notes: notes ||"",
 scheduledDate: scheduledDate || null,
 scheduledSlot: scheduledSlot ||"",
 fee: fee || 0,
 });

 return NextResponse.json(
 { message:"Booking saved", booking },
 { status: 201 }
 );
 } catch (error) {
 console.error("Booking save error:", error);
 return NextResponse.json(
 { error:"Failed to save booking." },
 { status: 500 }
 );
 }
}
