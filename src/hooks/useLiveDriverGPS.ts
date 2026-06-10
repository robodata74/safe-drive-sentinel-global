"use client";

import { useEffect, useRef } from "react";

/**
 * =========================
 * TYPES
 * =========================
 */
interface GPSOptions {
  driverId: string;
  socket: WebSocket | null;
  enableHighAccuracy?: boolean;
  intervalMs?: number;
}

/**
 * =========================
 * LIVE DRIVER GPS HOOK (HARDENED)
 * =========================
 * - Safe WebSocket handling
 * - Battery optimized throttling
 * - SSR-safe
 * - connection-aware streaming
 */
export function useLiveDriverGPS(options: GPSOptions) {
  const watchId = useRef<number | null>(null);
  const lastSent = useRef<number>(0);

  useEffect(() => {
    if (!options.driverId || !options.socket) return;

    const intervalMs = options.intervalMs ?? 2000;

    const socket = options.socket;

    /**
     * =========================
     * SOCKET SAFETY CHECK
     * =========================
     */
    const isSocketOpen = () => socket && socket.readyState === 1; // WebSocket.OPEN = 1

    /**
     * =========================
     * GPS WATCH START
     * =========================
     */
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();

          /**
           * THROTTLE (battery + bandwidth protection)
           */
          if (now - lastSent.current < intervalMs) return;

          if (!isSocketOpen()) return;

          lastSent.current = now;

          const payload = {
            type: "gps_update",
            payload: {
              driverId: options.driverId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              speed: position.coords.speed ?? null,
              heading: position.coords.heading ?? null,
              timestamp: now,
            },
          };

          try {
            socket.send(JSON.stringify(payload));
          } catch (err) {
            console.error("Socket send failed:", err);
          }
        },
        (error) => {
          console.error("GPS ERROR:", error);
        },
        {
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          maximumAge: 1000,
          timeout: 10000,
        },
      );
    }

    /**
     * =========================
     * CLEANUP
     * =========================
     */
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [options.driverId, options.socket, options.intervalMs]);
}
