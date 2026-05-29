import { supabaseAdmin } from "@/lib/supabase/admin";

type GPSInsert = {
  flatbed_id: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  updated_at: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as GPSInsert;

  const payload: GPSInsert = {
    flatbed_id: body.flatbed_id,
    lat: body.lat,
    lng: body.lng,
    speed: body.speed ?? 0,
    heading: body.heading ?? 0,
    updated_at: new Date().toISOString(),
  };

  /**
   * 🔥 THIS FIXES `never[]` COMPLETELY
   */
  const { data, error } = await supabaseAdmin
    .from("gps_tracks")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return Response.json({ success: false, error }, { status: 500 });
  }

  return Response.json({ success: true, data });
}
