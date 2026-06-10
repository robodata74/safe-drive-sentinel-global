"use client";

import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

/**
 * =========================
 * LIVE DISPATCH MAP (HARDENED)
 * =========================
 * FIXES:
 * - marker cleanup
 * - offline removal
 * - smoother updates
 * - memory-safe rendering
 */

export default function LiveDispatchMap() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);

  const driverMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const bookingMarkers = useRef<Map<string, maplibregl.Marker>>(new Map());

  /**
   * =========================
   * INIT MAP
   * =========================
   */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [36.8219, -1.2921],
      zoom: 12,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /**
   * =========================
   * REALTIME SYNC ENGINE
   * =========================
   */
  useEffect(() => {
    const unsubscribe = dispatchStore.subscribe(() => {
      const map = mapRef.current;
      if (!map) return;

      const snapshot = dispatchStore.getSnapshot();

      const activeDriverIds = new Set(snapshot.drivers.map((d) => d.id));
      const activeBookingIds = new Set(snapshot.bookings.map((b) => b.id));

      /**
       * =========================
       * REMOVE STALE DRIVERS
       * =========================
       */
      for (const [id, marker] of driverMarkers.current.entries()) {
        if (!activeDriverIds.has(id)) {
          marker.remove();
          driverMarkers.current.delete(id);
        }
      }

      /**
       * =========================
       * REMOVE STALE BOOKINGS
       * =========================
       */
      for (const [id, marker] of bookingMarkers.current.entries()) {
        if (!activeBookingIds.has(id)) {
          marker.remove();
          bookingMarkers.current.delete(id);
        }
      }

      /**
       * =========================
       * UPDATE DRIVERS
       * =========================
       */
      snapshot.drivers.forEach((driver) => {
        const lng = driver.location.lng;
        const lat = driver.location.lat;

        const existing = driverMarkers.current.get(driver.id);

        if (existing) {
          existing.setLngLat([lng, lat]);
          return;
        }

        const el = document.createElement("div");
        el.innerHTML = "🚛";
        el.style.fontSize = "26px";

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup().setHTML(`
              <strong>${driver.name ?? "Driver"}</strong><br/>
              Status: ${driver.status}
            `),
          )
          .addTo(map);

        driverMarkers.current.set(driver.id, marker);
      });

      /**
       * =========================
       * UPDATE BOOKINGS
       * =========================
       */
      snapshot.bookings.forEach((booking) => {
        const lng = booking.pickup.lng;
        const lat = booking.pickup.lat;

        const existing = bookingMarkers.current.get(booking.id);

        if (existing) {
          existing.setLngLat([lng, lat]);
          return;
        }

        const el = document.createElement("div");
        el.innerHTML = "📍";
        el.style.fontSize = "26px";

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(
            new maplibregl.Popup().setHTML(`
              <strong>Booking</strong><br/>
              Status: ${booking.status}
            `),
          )
          .addTo(map);

        bookingMarkers.current.set(booking.id, marker);
      });
    });

    return unsubscribe;
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100vh",
        borderRadius: 16,
        overflow: "hidden",
      }}
    />
  );
}
