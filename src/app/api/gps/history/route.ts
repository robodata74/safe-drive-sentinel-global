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

    // Placeholder history (Supabase integration later)
    const history = [
      {
        lat: -1.2921,
        lng: 36.8219,
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch GPS history",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}