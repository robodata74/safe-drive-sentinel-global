export interface Point {
  lat: number;
  lng: number;
}

export interface DriverMotionState {
  current: Point;
  target: Point;

  velocity: number; // smoothing speed factor (0.01 - 0.2 recommended)
  lastUpdate: number;
}

/**
 * =========================
 * DISTANCE (meters)
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
 * EASING (UBER FEEL)
 * =========================
 */
export function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * =========================
 * CORE PHYSICS STEP
 * =========================
 * Smoothly moves current → target
 */
export function stepMotion(
  state: DriverMotionState,
  deltaTime: number = 1,
): Point {
  const dx = state.target.lat - state.current.lat;
  const dy = state.target.lng - state.current.lng;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.0000005) {
    return state.target;
  }

  // adaptive smoothing (prevents jitter + teleport)
  const speed = Math.min(state.velocity * deltaTime, 1);

  const eased = ease(speed);

  return {
    lat: state.current.lat + dx * eased,
    lng: state.current.lng + dy * eased,
  };
}

/**
 * =========================
 * CREATE DRIVER STATE
 * =========================
 */
export function createMotionState(
  start: Point,
  velocity = 0.08,
): DriverMotionState {
  return {
    current: start,
    target: start,
    velocity,
    lastUpdate: Date.now(),
  };
}

/**
 * =========================
 * UPDATE TARGET (from WS)
 * =========================
 */
export function updateTarget(
  state: DriverMotionState,
  target: Point,
): DriverMotionState {
  return {
    ...state,
    target,
    lastUpdate: Date.now(),
  };
}
