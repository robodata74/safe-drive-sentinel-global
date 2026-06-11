"use client";

import { useEffect, useRef } from "react";

export interface DriverGpsPayload {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
}

/**
 * =========================
 * GPS STREAM CONFIG
 * =========================
 */
const DEFAULT_INTERVAL_MS = 3000; // 3s safe production interval

/**
 * =========================
 * LIVE DRIVER GPS HOOK
 * =========================
 *
 * Used in:
 * - Driver mobile app
 * - Driver web dashboard
 * - Testing environment
 */
export function useDriverGpsStream(
  driverId: string | undefined,
  getPosition: () => Promise<{ lat: number; lng: number }>,
  sendUpdate: (data: DriverGpsPayload) => void,
  options?: {
    intervalMs?: number;
    enable?: boolean;
  },
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPosition = useRef<{ lat: number; lng: number } | null>(null);

  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  const enabled = options?.enable ?? true;

  /**
   * =========================
   * START GPS STREAM
   * =========================
   */
  useEffect(() => {
    if (!driverId || !enabled) return;

    const start = async () => {
      intervalRef.current = setInterval(async () => {
        try {
          const pos = await getPosition();

          /**
           * =========================
           * THROTTLE DUPLICATES
           * =========================
           */
          const prev = lastPosition.current;

          const changed =
            !prev ||
            Math.abs(prev.lat - pos.lat) > 0.00001 ||
            Math.abs(prev.lng - pos.lng) > 0.00001;

          if (!changed) return;

          lastPosition.current = pos;

          /**
           * SEND TO SOCKET / SERVER
           */
          sendUpdate({
            driverId,
            lat: pos.lat,
            lng: pos.lng,
            speed: 0, // can be upgraded later
            heading: 0,
          });
        } catch (err) {
          console.error("[GPS STREAM ERROR]", err);
        }
      }, intervalMs);
    };

    start();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [driverId, enabled, intervalMs]);
}
