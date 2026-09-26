import { NextRequest, NextResponse } from"next/server";
import connectDB from"@/lib/mongodb";
import Patient from"@/models/Patient";

export async function GET(request: NextRequest) {
 try {
 await connectDB();
 const { searchParams } = new URL(request.url);
 const search = searchParams.get("search");
 const status = searchParams.get("status");
 const department = searchParams.get("department");

  const filter: any = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }
 if (status) filter.status = status;
 if (department) filter.department = department;

 const patients = await Patient.find(filter).sort({ createdAt: -1 });
 return NextResponse.json({ patients }, { status: 200 });
 } catch (error: any) {
 console.error("GET Patients Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: NextRequest) {
 try {
 await connectDB();
 const body = await request.json();
 const newPatient = await Patient.create(body);
 return NextResponse.json(newPatient, { status: 201 });
 } catch (error: any) {
 console.error("POST Patient Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
