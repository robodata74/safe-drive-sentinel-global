export interface Point {
  lat: number;
  lng: number;
}

export interface MotionVector {
  from: Point;
  to: Point;
  velocity: number; // meters/sec
  timestamp: number;
}

export interface SmoothMotionState {
  current: Point;
  target: Point;
  lastUpdate: number;
  speedFactor: number;
}

/**
 * =========================
 * HAVERSINE DISTANCE (meters)
 * =========================
 */
export function getDistance(a: Point, b: Point): number {
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
 * =========================
 * LINEAR INTERPOLATION
 * =========================
 */
export function interpolatePoint(from: Point, to: Point, t: number): Point {
  const clamped = Math.max(0, Math.min(1, t));

  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
  };
}

/**
 * =========================
 * UBER EASING CURVE
 * smooth acceleration / deceleration
 * =========================
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * =========================
 * MOTION FRAMES (ANIMATION PATH)
 * =========================
 */
export function createMotionFrames(
  from: Point,
  to: Point,
  steps = 48,
): Point[] {
  const frames: Point[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = easeInOutCubic(t);

    frames.push(interpolatePoint(from, to, eased));
  }

  return frames;
}

/**
 * =========================
 * CORE UBER STEP ENGINE
 * (real-time incremental movement)
 * =========================
 */
export function computeNextPosition(
  current: Point,
  target: Point,
  speedFactor = 0.1,
): Point {
  const dx = target.lat - current.lat;
  const dy = target.lng - current.lng;

  const distance = Math.sqrt(dx * dx + dy * dy);

  // already at target
  if (distance < 0.0000005) return target;

  return {
    lat: current.lat + dx * speedFactor,
    lng: current.lng + dy * speedFactor,
  };
}

/**
 * =========================
 * GPS NOISE FILTER
 * removes jitter from real devices
 * =========================
 */
export function filterNoise(
  previous: Point,
  next: Point,
  threshold = 0.000015,
): Point {
  const dLat = Math.abs(next.lat - previous.lat);
  const dLng = Math.abs(next.lng - previous.lng);

  if (dLat < threshold && dLng < threshold) {
    return previous;
  }

  return next;
}

/**
 * =========================
 * SPEED ESTIMATOR (OPTIONAL UBER LAYER)
 * =========================
 */
export function estimateSpeed(from: Point, to: Point, seconds: number): number {
  const distance = getDistance(from, to);

  if (seconds <= 0) return 0;

  return distance / seconds; // m/s
}
