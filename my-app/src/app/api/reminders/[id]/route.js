import { NextResponse } from"next/server";
import connectDB from "@/lib/mongodb";
import Reminder from"@/models/Reminder";

export async function GET(req, { params }) {
 try {
 await connectDB();
 const { id } = params;
 const reminder = await Reminder.findById(id);
 if (!reminder) return NextResponse.json({ error:"Not found" }, { status: 404 });
 return NextResponse.json({ reminder });
 } catch (error) {
 return NextResponse.json({ error:"Internal Server Error" }, { status: 500 });
 }
}

export async function PUT(req, { params }) {
 try {
 await connectDB();
 const { id } = params;
 const body = await req.json();
 const reminder = await Reminder.findByIdAndUpdate(id, body, { new: true });
 if (!reminder) return NextResponse.json({ error:"Not found" }, { status: 404 });
 return NextResponse.json({ reminder });
 } catch (error) {
 return NextResponse.json({ error:"Internal Server Error" }, { status: 500 });
 }
}

export async function DELETE(req, { params }) {
 try {
 await connectDB();
 const { id } = params;
 await Reminder.findByIdAndDelete(id);
 return NextResponse.json({ message:"Deleted" });
 } catch (error) {
 return NextResponse.json({ error:"Internal Server Error" }, { status: 500 });
 }
}
