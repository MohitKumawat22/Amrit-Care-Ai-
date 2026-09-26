import { NextRequest, NextResponse } from"next/server";
import supabase from"@/lib/supabase";

export async function GET(request: NextRequest) {
 try {
 const { searchParams } = new URL(request.url);
 const filterType = searchParams.get("filter");

 let query = supabase.from("medicines").select("*").order("name", { ascending: true });

 if (filterType === "low_stock") {
 // Supabase doesn't support cross-column comparison in filters easily,
 // so we fetch all and filter in code for this edge case
 const { data: medicines, error } = await query;
 if (error) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
 const filtered = (medicines || []).filter(m => m.stock <= m.low_stock_threshold);
 return NextResponse.json({ medicines: filtered }, { status: 200 });
 }

 const { data: medicines, error } = await query;
 if (error) {
 console.error("GET Medicines Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json({ medicines: medicines || [] }, { status: 200 });
 } catch (error: any) {
 console.error("GET Medicines Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
 const body = await request.json();
 const { data: newMedicine, error } = await supabase
 .from("medicines")
 .insert({
 name: body.name,
 type: body.type || "tablet",
 stock: body.stock || 0,
 unit: body.unit || "units",
 expiry_date: body.expiryDate || null,
 low_stock_threshold: body.lowStockThreshold || 30,
 })
 .select()
 .single();

 if (error) {
 console.error("POST Medicine Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 return NextResponse.json(newMedicine, { status: 201 });
 } catch (error: any) {
 console.error("POST Medicine Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
