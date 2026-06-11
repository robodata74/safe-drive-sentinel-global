export interface Point {
  lat: number;
  lng: number;
}

export interface DriverMotionState {
  current: Point;
  target: Point;
  velocity: number;
  lastUpdate: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolatePoint(from: Point, to: Point, t: number): Point {
  return {
    lat: lerp(from.lat, to.lat, t),
    lng: lerp(from.lng, to.lng, t),
  };
}
