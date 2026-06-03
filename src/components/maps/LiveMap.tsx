"use client";

import type { LiveLocation } from "@/types";
import { useEffect, useRef, useState } from "react";

interface Props {
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  truckLocations?: LiveLocation[];
  interactive?: boolean;
  onPickupSelect?: (lat: number, lng: number, address: string) => void;
}

export default function LiveMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  truckLocations = [],
  interactive = false,
  onPickupSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const [mapError, setMapError] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // 1. INIT MAP (SAFE + NO RACE CONDITIONS)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "© OpenStreetMap",
              },
            },
            layers: [
              {
                id: "osm",
                type: "raster",
                source: "osm",
              },
            ],
          },
          center: [pickupLng ?? 36.8219, pickupLat ?? -1.2921],
          zoom: 12,
        });

        map.addControl(new maplibregl.NavigationControl(), "top-right");

        // Click to select pickup
        if (interactive && onPickupSelect) {
          map.on("click", async (e: any) => {
            const { lng, lat } = e.lngLat;

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              );
              const data = await res.json();

              onPickupSelect(
                lat,
                lng,
                data?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              );
            } catch {
              onPickupSelect(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }
          });
        }

        mapRef.current = map;
      } catch (err) {
        console.error("Map init failed:", err);
        setMapError("Failed to initialize map");
      }
    };

    initMap();

    return () => {
      cancelled = true;

      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ─────────────────────────────────────────────
  // 2. PICKUP MARKER
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || pickupLat == null || pickupLng == null) return;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      let marker = markersRef.current.get("pickup");

      if (!marker) {
        const el = document.createElement("div");
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.background = "#22c55e";
        el.style.border = "2px solid white";

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([pickupLng, pickupLat])
          .addTo(mapRef.current);

        markersRef.current.set("pickup", marker);
      } else {
        marker.setLngLat([pickupLng, pickupLat]);
      }
    });
  }, [pickupLat, pickupLng]);

  // ─────────────────────────────────────────────
  // 3. DROPOFF MARKER
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || dropoffLat == null || dropoffLng == null) return;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      let marker = markersRef.current.get("dropoff");

      if (!marker) {
        const el = document.createElement("div");
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.background = "#ef4444";
        el.style.border = "2px solid white";

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([dropoffLng, dropoffLat])
          .addTo(mapRef.current);

        markersRef.current.set("dropoff", marker);
      } else {
        marker.setLngLat([dropoffLng, dropoffLat]);
      }
    });
  }, [dropoffLat, dropoffLng]);

  // ─────────────────────────────────────────────
  // 4. TRUCK MARKERS (LIVE FLEET)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      truckLocations.forEach((loc) => {
        const key = `truck-${loc.flatbed_id}`;

        let marker = markersRef.current.get(key);

        if (!marker) {
          const el = document.createElement("div");
          el.textContent = "🚛";
          el.style.fontSize = "20px";

          marker = new maplibregl.Marker({ element: el })
            .setLngLat([loc.lng, loc.lat])
            .addTo(mapRef.current);

          markersRef.current.set(key, marker);
        } else {
          marker.setLngLat([loc.lng, loc.lat]);
        }
      });
    });
  }, [truckLocations]);

  // ─────────────────────────────────────────────
  // 5. FALLBACK UI
  // ─────────────────────────────────────────────
  if (mapError) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border bg-gray-100 p-6 text-center">
        <div>
          <p className="font-semibold">Map unavailable</p>
          <p className="text-sm text-gray-600 mt-2">{mapError}</p>

          {pickupLat && pickupLng && (
            <a
              href={`https://www.google.com/maps?q=${pickupLat},${pickupLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white"
            >
              Open in Google Maps
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[400px] w-full rounded-xl"
    />
  );
}
