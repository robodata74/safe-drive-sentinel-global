"use client";

import { createClient } from "@/lib/supabase/client";
import type { LiveLocation } from "@/types";
import { useEffect, useState } from "react";

export default function TestMapPage() {
  const supabase = createClient();

  const [locations, setLocations] = useState<LiveLocation[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("gps_tracks_test")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gps_tracks" },
        (payload) => {
          setLocations((prev) => [...prev, payload.new as LiveLocation]);
        },
      )
      .subscribe();

    const seed: LiveLocation[] = [
      {
        flatbed_id: "TEST-1",
        lat: 1.2921,
        lng: 36.8219,
        speed: 0,
        heading: 0,
        updated_at: new Date().toISOString(),
      },
      {
        flatbed_id: "TEST-2",
        lat: 1.3,
        lng: 36.83,
        speed: 0,
        heading: 0,
        updated_at: new Date().toISOString(),
      },
    ];

    setLocations(seed);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">Test Map</h1>

      <pre className="text-xs bg-black/40 p-4 rounded-lg overflow-auto">
        {JSON.stringify(locations, null, 2)}
      </pre>
    </div>
  );
}
