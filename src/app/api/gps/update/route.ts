import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type GPSPayload = {
  flatbed_id: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body: GPSPayload = await req.json();

    const payload = {
      flatbed_id: body.flatbed_id,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? 0,
      heading: body.heading ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("gps_tracks")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
