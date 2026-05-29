"use client";

import type { LiveLocation } from "@/types";
import { useEffect, useRef } from "react";

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
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled) return;

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
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
              data?.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            );
          } catch {
            onPickupSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        });
      }

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || pickupLat == null || pickupLng == null) return;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.background = "#22c55e";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pickupLng, pickupLat])
        .addTo(mapRef.current);

      markersRef.current.set("pickup", marker);
    });
  }, [pickupLat, pickupLng]);

  useEffect(() => {
    if (!mapRef.current) return;

    import("maplibre-gl").then(({ default: maplibregl }) => {
      truckLocations.forEach((loc) => {
        const key = `truck-${loc.flatbed_id}`;

        let marker = markersRef.current.get(key);

        if (!marker) {
          const el = document.createElement("div");
          el.innerText = "🚛";

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

  return <div ref={mapContainer} className="w-full h-full rounded-xl" />;
}
