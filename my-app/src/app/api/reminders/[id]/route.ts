import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Reminder from "@/models/Reminder";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ reminder }, { status: 200 });
  } catch (error) {
    console.error("GET Single Reminder Error:", error);
    return NextResponse.json({ error: "Failed to fetch reminder" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const updatedReminder = await Reminder.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updatedReminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    return NextResponse.json({ reminder: updatedReminder }, { status: 200 });
  } catch (error) {
    console.error("PUT Reminder Error:", error);
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const { id } = await params;
    const result = await Reminder.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Reminder not found in database", idReceived: id }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Reminder permanently deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE Reminder Error:", error);
    return NextResponse.json({ error: "Failed to delete reminder", details: error.message }, { status: 500 });
  }
}
