import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const flatbed_id = searchParams.get("flatbed_id");

    if (!flatbed_id) {
      return NextResponse.json(
        { success: false, message: "flatbed_id required" },
        { status: 400 }
      );
    }

    // Placeholder for Supabase realtime stream (ZIP 2 next step)
    const liveLocation = {
      flatbed_id,
      lat: -1.2921,
      lng: 36.8219,
      speed: 0,
      heading: 0,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: liveLocation,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch live GPS",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}