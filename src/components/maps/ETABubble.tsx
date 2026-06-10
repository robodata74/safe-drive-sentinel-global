"use client";

import { computeETA } from "@/lib/dispatch/gps/eta";
import type { Point } from "@/lib/dispatch/gps/smoothMotion";
import { useEffect, useState } from "react";

interface Props {
  driver: Point;
  destination: Point;
  speed?: number;
}

/**
 * Floating Uber-style ETA bubble
 */
export default function ETABubble({ driver, destination, speed = 12 }: Props) {
  const [eta, setEta] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const result = computeETA(driver, destination, speed);
      setEta(result.label);
    };

    update();

    const interval = setInterval(update, 5000); // refresh every 5s

    return () => clearInterval(interval);
  }, [driver.lat, driver.lng, destination.lat, destination.lng, speed]);

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2">
      <div className="rounded-full bg-black/80 backdrop-blur px-3 py-1 text-xs text-white border border-white/10 shadow-lg">
        🚛 {eta}
      </div>
    </div>
  );
}
