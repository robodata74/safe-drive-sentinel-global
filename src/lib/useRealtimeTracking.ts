"use client";

import { supabase } from "@/lib/supabase/client";
import type { LiveLocation } from "@/types";
import { useEffect, useState } from "react";

export function useRealtimeTracking(flatbed_id?: string) {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flatbed_id) return;

    // INITIAL FETCH
    const fetchInitial = async () => {
      try {
        const res = await fetch(
          `/api/gps/live?flatbed_id=${encodeURIComponent(flatbed_id)}`,
        );

        const json = await res.json();

        if (json?.success) {
          setLocation(json.data);
        } else {
          setError(json?.error ?? "Failed to fetch GPS");
        }
      } catch (e: any) {
        setError(e?.message ?? "Network error");
      }
    };

    fetchInitial();

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel(`gps-${flatbed_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gps_tracks",
          filter: `flatbed_id=eq.${flatbed_id}`,
        },
        (payload) => {
          if (!payload?.new) return;

          const data = payload.new as LiveLocation;

          setLocation({
            flatbed_id: data.flatbed_id,
            lat: data.lat,
            lng: data.lng,
            speed: data.speed,
            heading: data.heading,
            updated_at: data.updated_at,
          });

          setError(null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flatbed_id]);

  return { location, error };
}
