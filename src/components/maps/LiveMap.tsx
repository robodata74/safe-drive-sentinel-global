"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import type { LiveDriverUpdate } from "@/hooks/useGpsSocket";
import { useGpsSocket } from "@/hooks/useGpsSocket";


/**
 * =========================
 * TYPES
 * =========================
 */

type MapInstance = maplibregl.Map;
type MarkerInstance = maplibregl.Marker;

type DriverMarkerEntry = {
  marker: MarkerInstance;
  etaEl: HTMLDivElement | null;
};

type MarkerRegistry = globalThis.Map<string, DriverMarkerEntry>;

export interface LiveLocation {
  driver_id: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  updated_at?: string;
}

/**
 * =========================
 * ETA ENGINE
 * =========================
 */

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function computeETA(distanceKm: number): number {
  const avgSpeed = 40; // km/h baseline (flatbed)
  return Math.max(1, Math.round((distanceKm / avgSpeed) * 60));
}

/**
 * =========================
 * COMPONENT
 * =========================
 */

interface Props {
  pickupLat?: number;
  pickupLng?: number;

  dropoffLat?: number;
  dropoffLng?: number;

  truckLocations?: LiveLocation[];

  interactive?: boolean;
  wsUrl?: string;

  onPickupSelect?: (lat: number, lng: number, address: string) => void;
  onDropoffSelect?: (lat: number, lng: number, address: string) => void;
}

export default function LiveMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  truckLocations = [],
  interactive = false,
  wsUrl = "ws://localhost:4001",
  onPickupSelect,
  onDropoffSelect,
}: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);

  const driversRef = useRef<MarkerRegistry>(new globalThis.Map());

  const pickupMarker = useRef<MarkerInstance | null>(null);
  const dropoffMarker = useRef<MarkerInstance | null>(null);

  const selectionMode = useRef<"pickup" | "dropoff">("pickup");

  const [mapError, setMapError] = useState<string | null>(null);

  /**
   * =========================
   * SMOOTH MOTION STATE
   * =========================
   */
  const [driverTargets, setDriverTargets] = useState<
    Record<string, { lat: number; lng: number }>
  >({});

  /**
   * =========================
   * INIT MAP
   * =========================
   */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
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

      if (interactive) {
        map.on("click", async (e) => {
          const lat = e.lngLat.lat;
          const lng = e.lngLat.lng;

          let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            );
            const data = await res.json();
            address = data?.display_name ?? address;
          } catch {}

          if (selectionMode.current === "pickup") {
            onPickupSelect?.(lat, lng, address);
            selectionMode.current = "dropoff";
          } else {
            onDropoffSelect?.(lat, lng, address);
            selectionMode.current = "pickup";
          }
        });
      }

      mapRef.current = map;
    } catch (err) {
      console.error(err);
      setMapError("Map failed to initialize");
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      driversRef.current.clear();
    };
  }, [interactive]);

  /**
   * =========================
   * WEBSOCKET → SMOOTH TARGETS
   * =========================
   */
  useGpsSocket({
    url: wsUrl,

    onDriverUpdate: (driver: LiveDriverUpdate) => {
      setDriverTargets((prev) => ({
        ...prev,
        [driver.driver_id]: {
          lat: driver.lat,
          lng: driver.lng,
        },
      }));
    },
  });

  /**
   * =========================
   * SMOOTH MOTION ENGINE (UBER CORE)
   * =========================
   */
  Object.entries(driverTargets).forEach(([id, target]) => {
    const entry = driversRef.current.get(id);

    // create marker if missing
    if (!entry) {
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";

      const icon = document.createElement("div");
      icon.innerHTML = "🚛";
      icon.style.fontSize = "18px";

      const eta = document.createElement("div");
      eta.style.position = "absolute";
      eta.style.top = "-20px";
      eta.style.left = "50%";
      eta.style.transform = "translateX(-50%)";
      eta.style.padding = "2px 6px";
      eta.style.fontSize = "10px";
      eta.style.borderRadius = "999px";
      eta.style.background = "rgba(0,0,0,0.75)";
      eta.style.color = "white";

      wrapper.appendChild(icon);
      wrapper.appendChild(eta);

      const marker = new maplibregl.Marker({ element: wrapper })
        .setLngLat([target.lng, target.lat])
        .addTo(mapRef.current!);

      driversRef.current.set(id, { marker, etaEl: eta });
      return;
    }

    /**
     * SMOOTH INTERPOLATION STEP (Uber feel)
     */
    const current = entry.marker.getLngLat();

    const nextLng = current.lng + (target.lng - current.lng) * 0.08;
    const nextLat = current.lat + (target.lat - current.lat) * 0.08;

    entry.marker.setLngLat([nextLng, nextLat]);

    /**
     * ETA UPDATE
     */
    if (pickupLat && pickupLng && entry.etaEl) {
      const dist = haversineDistance(nextLat, nextLng, pickupLat, pickupLng);
      const eta = computeETA(dist);

      entry.etaEl.textContent = eta <= 1 ? "Arriving" : `${eta} min`;
    }
  });

  /**
   * =========================
   * PICKUP MARKER
   * =========================
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pickupLat == null || pickupLng == null) return;

    if (!pickupMarker.current) {
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.background = "#22c55e";
      el.style.border = "2px solid white";

      pickupMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([pickupLng, pickupLat])
        .addTo(map);
    } else {
      pickupMarker.current.setLngLat([pickupLng, pickupLat]);
    }
  }, [pickupLat, pickupLng]);

  /**
   * =========================
   * DROPOFF MARKER
   * =========================
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || dropoffLat == null || dropoffLng == null) return;

    if (!dropoffMarker.current) {
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.background = "#ef4444";
      el.style.border = "2px solid white";

      dropoffMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([dropoffLng, dropoffLat])
        .addTo(map);
    } else {
      dropoffMarker.current.setLngLat([dropoffLng, dropoffLat]);
    }
  }, [dropoffLat, dropoffLng]);

  /**
   * =========================
   * UI
   * =========================
   */
  if (mapError) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border bg-slate-900 text-white">
        {mapError}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full rounded-xl overflow-hidden"
    />
  );
}
