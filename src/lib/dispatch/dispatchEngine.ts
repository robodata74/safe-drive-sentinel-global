/**
 * ==========================================================
 * SAFEDRIVE GLOBAL
 * PRODUCTION DISPATCH ENGINE (HARDENED v2)
 * ==========================================================
 * Uber-style matching engine:
 * - Distance weighted scoring
 * - ETA prediction
 * - Driver health scoring
 * - Stable auto-matching
 * - Safe assignment logic
 * ==========================================================
 */

/**
 * ==========================================================
 * SHARED TYPES
 * ==========================================================
 */

export interface Point {
  lat: number;
  lng: number;
}

export type DriverStatus = "available" | "assigned" | "busy" | "offline";

export type BookingStatus = "pending" | "matched" | "assigned" | "completed";

/**
 * ==========================================================
 * DRIVER MODEL
 * ==========================================================
 */

export interface Driver {
  id: string;

  company_id?: string;

  name?: string;
  phone?: string;

  status: DriverStatus;

  location: Point;

  speed?: number;
  heading?: number;

  active_booking_id?: string;

  rating?: number;
  completed_jobs?: number;

  flatbed_id?: string;
  vehicle_type?: string;

  lastSeen: number;
}

/**
 * ==========================================================
 * BOOKING MODEL
 * ==========================================================
 */

export interface Booking {
  id: string;

  status: BookingStatus;

  pickup: Point;
  dropoff?: Point;

  pickup_address?: string;
  dropoff_address?: string;

  customer_name?: string;
  customer_phone?: string;

  fare_amount?: number;

  createdAt: number;

  assigned_driver_id?: string;
}

/**
 * ==========================================================
 * MATCH RESULT
 * ==========================================================
 */

export interface MatchResult {
  driverId: string;
  bookingId: string;

  score: number;

  etaMinutes: number;
  distanceKm: number;
}

/**
 * ==========================================================
 * CONFIG (TUNABLE ENGINE WEIGHTS)
 * ==========================================================
 */

const WEIGHTS = {
  distance: 0.45,
  eta: 0.3,
  freshness: 0.15,
  quality: 0.1,
};

const AVG_SPEED_KMH = 35;

/**
 * ==========================================================
 * DISTANCE ENGINE
 * ==========================================================
 */

export function haversineDistance(a: Point, b: Point): number {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const dist = 2 * R * Math.asin(Math.sqrt(x));

  return Number.isFinite(dist) ? dist : 0;
}

/**
 * ==========================================================
 * ETA ENGINE
 * ==========================================================
 */

export function estimateETA(distanceKm: number): number {
  const raw = (distanceKm / AVG_SPEED_KMH) * 60;

  if (!Number.isFinite(raw)) return 999;

  return Math.max(1, Math.round(raw));
}

/**
 * ==========================================================
 * DRIVER HEALTH
 * ==========================================================
 */

function freshnessScore(lastSeen: number): number {
  if (!lastSeen) return 0;

  const seconds = (Date.now() - lastSeen) / 1000;

  return Math.max(0, 100 - seconds);
}

function qualityScore(driver: Driver): number {
  const rating = driver.rating ?? 4.5;

  const safeRating = rating < 0 ? 0 : rating > 5 ? 5 : rating;

  return safeRating * 20;
}

/**
 * ==========================================================
 * MAIN ENGINE
 * ==========================================================
 */

export class DispatchEngine {
  /**
   * SCORE DRIVER
   */
  static score(driver: Driver, booking: Booking): number {
    if (!driver || !booking) return -1;

    if (driver.status !== "available") return -1;

    if (driver.active_booking_id) return -1;

    if (!driver.location || !booking.pickup) return -1;

    const distanceKm = haversineDistance(driver.location, booking.pickup);

    const etaMinutes = estimateETA(distanceKm);

    const distanceScore = Math.max(0, 100 - distanceKm * 10);

    const etaScore = Math.max(0, 100 - etaMinutes);

    const freshness = freshnessScore(driver.lastSeen);

    const quality = qualityScore(driver);

    const score =
      distanceScore * WEIGHTS.distance +
      etaScore * WEIGHTS.eta +
      freshness * WEIGHTS.freshness +
      quality * WEIGHTS.quality;

    return Number.isFinite(score) ? score : -1;
  }

  /**
   * FIND BEST DRIVER
   */
  static findBestDriver(
    booking: Booking,
    drivers: Driver[],
  ): MatchResult | null {
    let best: MatchResult | null = null;

    for (const driver of drivers) {
      const score = this.score(driver, booking);

      if (score < 0) continue;

      const distanceKm = haversineDistance(driver.location, booking.pickup);

      const etaMinutes = estimateETA(distanceKm);

      if (!best || score > best.score) {
        best = {
          driverId: driver.id,
          bookingId: booking.id,
          score,
          etaMinutes,
          distanceKm,
        };
      }
    }

    return best;
  }

  /**
   * AUTO MATCH (ONE DRIVER PER BOOKING)
   */
  static autoMatch(bookings: Booking[], drivers: Driver[]): MatchResult[] {
    const pending = bookings.filter((b) => b.status === "pending");

    const results: MatchResult[] = [];

    const usedDrivers = new Set<string>();

    for (const booking of pending) {
      const pool = drivers.filter((d) => !usedDrivers.has(d.id));

      const match = this.findBestDriver(booking, pool);

      if (match) {
        results.push(match);
        usedDrivers.add(match.driverId);
      }
    }

    return results;
  }

  /**
   * SAFE ASSIGNMENT
   */
  static assign(booking: Booking, driver: Driver) {
    return {
      booking: {
        ...booking,
        status: "assigned",
        assigned_driver_id: driver.id,
      },

      driver: {
        ...driver,
        status: "busy",
        active_booking_id: booking.id,
      },
    };
  }
}
