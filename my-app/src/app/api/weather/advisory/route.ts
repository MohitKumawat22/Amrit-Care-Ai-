import { NextRequest, NextResponse } from "next/server";
import { getWeatherAdvisory } from "@/lib/apilayer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat") || "15.2993";
    const lng = searchParams.get("lng") || searchParams.get("lon") || "74.1240";

    const advisory = await getWeatherAdvisory(lat, lng);
    return NextResponse.json({ advisory }, { status: 200 });
  } catch (error: any) {
    console.error("GET Weather Advisory Route Error:", error);
    return NextResponse.json(
      { advisory: "Pleasant weather today — remember to take your scheduled medications on time." },
      { status: 200 }
    );
  }
}
