import { logDispatchEvent } from "@/lib/dispatch/engine";
import { findNearestDriver } from "@/lib/dispatch/matcher";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const body = await req.json();

  const { booking_id, pickup_lat, pickup_lng } = body;

  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .eq("status", "available");

  const driver = findNearestDriver(pickup_lat, pickup_lng, drivers || []);

  if (!driver) {
    return NextResponse.json(
      { error: "No drivers available" },
      { status: 404 },
    );
  }

  await supabase
    .from("bookings")
    .update({
      driver_id: driver.id,
      status: "matched",
    })
    .eq("id", booking_id);

  await logDispatchEvent(booking_id, "driver_assigned", driver, driver.id);

  return NextResponse.json({
    success: true,
    driver,
  });
}
