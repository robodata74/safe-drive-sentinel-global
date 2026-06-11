"use client";

import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

/**
 * ==========================================
 * SAFE DRIVE GLOBAL — MAP RENDER ENGINE
 * STEP 3.8: STABLE REALTIME MAP LAYER
 * ==========================================
 */

type DriverMarker = {
  marker: maplibregl.Marker;
  lastLat: number;
  lastLng: number;
};

type BookingMarker = {
  marker: maplibregl.Marker;
};

export default function LiveDispatchMap() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const driverMarkers = useRef<Map<string, DriverMarker>>(new Map());
  const bookingMarkers = useRef<Map<string, BookingMarker>>(new Map());

  const initialized = useRef(false);

  /**
   * =========================
   * INIT MAP (ONCE ONLY)
   * =========================
   */
  useEffect(() => {
    if (!containerRef.current || initialized.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [36.8219, -1.2921],
      zoom: 11,
      maxZoom: 18,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;
    initialized.current = true;

    return () => {
      map.remove();

      // HARD CLEANUP
      driverMarkers.current.forEach((m) => m.marker.remove());
      bookingMarkers.current.forEach((m) => m.marker.remove());

      driverMarkers.current.clear();
      bookingMarkers.current.clear();

      mapRef.current = null;
      initialized.current = false;
    };
  }, []);

  /**
   * =========================
   * DIFF ENGINE (CORE FIX)
   * =========================
   */
  useEffect(() => {
    const unsubscribe = dispatchStore.subscribe(() => {
      const map = mapRef.current;
      if (!map) return;

      const snapshot = dispatchStore.getSnapshot();

      const activeDrivers = new Set(snapshot.drivers.map((d) => d.id));
      const activeBookings = new Set(snapshot.bookings.map((b) => b.id));

      /**
       * =========================
       * REMOVE STALE DRIVERS
       * =========================
       */
      for (const [id, entry] of driverMarkers.current.entries()) {
        if (!activeDrivers.has(id)) {
          entry.marker.remove();
          driverMarkers.current.delete(id);
        }
      }

      /**
       * =========================
       * REMOVE STALE BOOKINGS
       * =========================
       */
      for (const [id, entry] of bookingMarkers.current.entries()) {
        if (!activeBookings.has(id)) {
          entry.marker.remove();
          bookingMarkers.current.delete(id);
        }
      }

      /**
       * =========================
       * UPSERT DRIVERS (MOVE ONLY IF CHANGED)
       * =========================
       */
      for (const driver of snapshot.drivers) {
        const lng = driver.location.lng;
        const lat = driver.location.lat;

        const existing = driverMarkers.current.get(driver.id);

        if (existing) {
          const moved = existing.lastLat !== lat || existing.lastLng !== lng;

          if (moved) {
            existing.marker.setLngLat([lng, lat]);
            existing.lastLat = lat;
            existing.lastLng = lng;
          }

          continue;
        }

        const el = document.createElement("div");
        el.className = "driver-marker";
        el.innerHTML = "🚛";
        el.style.fontSize = "24px";
        el.style.transform = "translate(-50%, -50%)";

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup({ offset: 20 }).setHTML(`
              <div style="font-size:12px">
                <strong>${driver.name ?? "Driver"}</strong><br/>
                Status: ${driver.status}
              </div>
            `),
          )
          .addTo(map);

        driverMarkers.current.set(driver.id, {
          marker,
          lastLat: lat,
          lastLng: lng,
        });
      }

      /**
       * =========================
       * UPSERT BOOKINGS (NO DUPLICATES)
       * =========================
       */
      for (const booking of snapshot.bookings) {
        const lng = booking.pickup.lng;
        const lat = booking.pickup.lat;

        if (bookingMarkers.current.has(booking.id)) continue;

        const el = document.createElement("div");
        el.className = "booking-marker";
        el.innerHTML = "📍";
        el.style.fontSize = "22px";
        el.style.transform = "translate(-50%, -50%)";

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup({ offset: 20 }).setHTML(`
              <div style="font-size:12px">
                <strong>Booking</strong><br/>
                Status: ${booking.status}
              </div>
            `),
          )
          .addTo(map);

        bookingMarkers.current.set(booking.id, { marker });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
    />
  );
}
