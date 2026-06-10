import type { Point } from "./smoothMotion";

export interface ETAResult {
  distanceMeters: number;
  etaSeconds: number;
  etaMinutes: number;
  label: string;
}

/**
 * Haversine distance (meters)
 */
export function getDistanceMeters(a: Point, b: Point): number {
  const R = 6371000;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Converts distance + speed → ETA
 * speed = meters per second
 */
export function computeETA(
  driver: Point,
  destination: Point,
  speedMps = 12, // ~ 43 km/h default city driving
): ETAResult {
  const distance = getDistanceMeters(driver, destination);

  const etaSeconds = distance / speedMps;
  const etaMinutes = Math.max(1, Math.round(etaSeconds / 60));

  let label = "";

  if (etaMinutes <= 1) {
    label = "Arriving";
  } else if (etaMinutes <= 2) {
    label = "1–2 min";
  } else {
    label = `${etaMinutes} min`;
  }

  return {
    distanceMeters: distance,
    etaSeconds,
    etaMinutes,
    label,
  };
}
