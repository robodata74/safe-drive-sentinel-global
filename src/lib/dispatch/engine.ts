import { createClient } from "@/lib/supabase/server";

export type DriverLocation = {
  driver_id: string;
  lat: number;
  lng: number;
  status: "available" | "busy";
};

export async function logDispatchEvent(
  booking_id: string,
  event_type: string,
  payload: any,
  driver_id?: string,
) {
  const supabase = await createClient();

  await supabase.from("dispatch_events").insert({
    booking_id,
    driver_id: driver_id ?? null,
    event_type,
    payload,
  });
}
