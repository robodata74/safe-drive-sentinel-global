export interface Point {
  lat: number;
  lng: number;
}

export type DriverStatus = "available" | "busy" | "offline";

export interface Driver {
  id: string;
  status: DriverStatus;
  location: Point;
  lastSeen: number;

  // optional but critical for stability
  active_booking_id?: string;
}

export interface Booking {
  id: string;
  status: "pending" | "assigned" | "completed";
  pickup: Point;
  createdAt: number;

  priority?: number; // 🔥 emergency support
}

export interface MatchResult {
  driverId: string;
  bookingId: string;
  score: number;
}

/**
 * =========================
 * GEO CORE
 * =========================
 */
function haversine(a: Point, b: Point): number {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * =========================
 * ETA MODEL (REALISTIC URBAN)
 * =========================
 */
function etaMinutes(distanceKm: number): number {
  const avgSpeed = 35;
  return Math.max(1, Math.round((distanceKm / avgSpeed) * 60));
}

/**
 * =========================
 * AI SCORING ENGINE (UBER-LIKE)
 * =========================
 */
export class AIDispatchEngine {
  static score(driver: Driver, booking: Booking): number {
    if (driver.status !== "available") return -1;

    const distance = haversine(driver.location, booking.pickup);
    const eta = etaMinutes(distance);

    /**
     * 🔥 CORE WEIGHTS (TUNABLE AI MODEL)
     */

    // closer = better
    const distanceScore = Math.max(0, 100 - distance * 12);

    // faster arrival = better
    const etaScore = Math.max(0, 100 - eta * 2);

    // freshness of driver GPS
    const freshnessScore = Math.max(
      0,
      100 - (Date.now() - driver.lastSeen) / 1000,
    );

    // priority boost (emergency / premium)
    const priorityBoost = booking.priority ? booking.priority * 10 : 0;

    return (
      distanceScore * 0.45 +
      etaScore * 0.35 +
      freshnessScore * 0.15 +
      priorityBoost
    );
  }

  /**
   * =========================
   * BEST DRIVER PICK
   * =========================
   */
  static findBestDriver(
    booking: Booking,
    drivers: Driver[],
  ): MatchResult | null {
    let best: MatchResult | null = null;

    for (const driver of drivers) {
      const score = this.score(driver, booking);

      if (score < 0) continue;

      if (!best || score > best.score) {
        best = {
          driverId: driver.id,
          bookingId: booking.id,
          score,
        };
      }
    }

    return best;
  }

  /**
   * =========================
   * BULK MATCH ENGINE
   * =========================
   */
  static matchAll(bookings: Booking[], drivers: Driver[]): MatchResult[] {
    const results: MatchResult[] = [];

    const pending = bookings.filter((b) => b.status === "pending");

    const availableDrivers = drivers.filter((d) => d.status === "available");

    for (const booking of pending) {
      const match = this.findBestDriver(booking, availableDrivers);

      if (match) {
        results.push(match);

        // remove driver so no double assignment
        const index = availableDrivers.findIndex(
          (d) => d.id === match.driverId,
        );

        if (index !== -1) {
          availableDrivers.splice(index, 1);
        }
      }
    }

    return results;
  }
}
