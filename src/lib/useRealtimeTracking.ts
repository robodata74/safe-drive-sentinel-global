import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

type GPSPayload = {
  new: {
    flatbed_id: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    updated_at: string;
  };
};

export function useRealtimeTracking(
  onUpdate: (data: GPSPayload["new"]) => void,
) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("gps-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gps_tracks" },
        (payload: GPSPayload) => {
          onUpdate(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
