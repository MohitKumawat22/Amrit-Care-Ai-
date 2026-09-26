import { NextRequest, NextResponse } from "next/server";
import { lookupMedicineInfo } from "@/lib/apilayer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || searchParams.get("query") || "";

    if (!name) {
      return NextResponse.json(
        { error: "Medicine name query parameter is required" },
        { status: 400 }
      );
    }

    const data = await lookupMedicineInfo(name);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("GET Medicine Lookup Route Error:", error);
    return NextResponse.json({ found: false, error: error.message }, { status: 500 });
  }
}
