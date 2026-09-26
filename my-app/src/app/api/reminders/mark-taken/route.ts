import { NextRequest, NextResponse } from"next/server";
import supabase from"@/lib/supabase";

export async function POST(request: NextRequest) {
 try {
 const { reminderId, scheduledTime, status } = await request.json();

 if (!reminderId || !scheduledTime || !status) {
 return NextResponse.json({ error:"Missing required fields" }, { status: 400 });
 }

 const { data: reminder, error } = await supabase
 .from("reminders")
 .select("*")
 .eq("id", reminderId)
 .single();

 if (error || !reminder) {
 return NextResponse.json({ error:"Reminder not found" }, { status: 404 });
 }

 const takenLog = reminder.taken_log || [];
 let remainingQuantity = reminder.remaining_quantity;

 // Logic for quantity deduction
 if (status === "taken") {
 remainingQuantity = Math.max(0, remainingQuantity - reminder.tablets_per_dose);
 }

 // Add log entry
 takenLog.push({
 scheduledTime: new Date(scheduledTime).toISOString(),
 takenAt: status === "taken" ? new Date().toISOString() : null,
 status: status,
 quantityConsumed: status === "taken" ? reminder.tablets_per_dose : 0,
 });

 const { data: updated, error: updateErr } = await supabase
 .from("reminders")
 .update({
 remaining_quantity: remainingQuantity,
 taken_log: takenLog,
 updated_at: new Date().toISOString(),
 })
 .eq("id", reminderId)
 .select()
 .single();

 if (updateErr) {
 console.error("Mark Taken Update Error:", updateErr);
 return NextResponse.json({ error:"Failed to mark reminder as taken" }, { status: 500 });
 }

 return NextResponse.json({ reminder: updated }, { status: 200 });
 } catch (error) {
 console.error("Mark Taken Error:", error);
 return NextResponse.json({ error:"Failed to mark reminder as taken" }, { status: 500 });
 }
}
