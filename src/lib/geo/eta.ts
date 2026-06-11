/**
 * =========================
 * SAFE DRIVE — ETA ENGINE
 * STEP 3.7
 * =========================
 */

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 6371; // km

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * avg speed assumption for dispatch vehicles
 * (tunable later for AI layer)
 */
export function estimateETA(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const distanceKm = haversineDistance(lat1, lng1, lat2, lng2);

  const avgSpeedKmh = 40; // urban towing estimate

  const hours = distanceKm / avgSpeedKmh;

  return Math.max(1, Math.round(hours * 60)); // minutes
}
