export type BookingStatus = "pending" | "matched" | "assigned" | "completed";

export interface Booking {
  id: string;
  status: BookingStatus;
  pickup_address: string;
  dropoff_address?: string;
  fare_amount?: number;
  created_at: string;
  customer_name?: string;

  lat?: number;
  lng?: number;
}

export type DriverStatus = "available" | "busy" | "offline";

export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  lat: number;
  lng: number;
  active_booking_id?: string;
}

/**
 * 🔥 SINGLE SOURCE OF TRUTH (FIXED)
 * Replaces flatbed_id → driver_id
 */
export interface LiveLocation {
  driver_id: string;

  lat: number;
  lng: number;

  speed: number;
  heading: number;

  updated_at: string;
}

export interface MatchResult {
  driverId: string;
  bookingId: string;
  score: number;
}

/**
 * ==============================
 * DISPATCH AI ENGINE v2
 * ==============================
 */
export class DispatchEngine {
  static distanceScore(driver: Driver, booking: Booking): number {
    if (!booking.lat || !booking.lng) return 0;

    const dx = driver.lat - booking.lat;
    const dy = driver.lng - booking.lng;

    const distance = Math.sqrt(dx * dx + dy * dy);

    return Math.max(0, 100 - distance * 100);
  }

  static availabilityScore(driver: Driver): number {
    switch (driver.status) {
      case "available":
        return 100;
      case "busy":
        return 40;
      case "offline":
        return 0;
    }
  }

  static demandScore(booking: Booking): number {
    switch (booking.status) {
      case "pending":
        return 100;
      case "matched":
        return 50;
      default:
        return 10;
    }
  }

  static score(driver: Driver, booking: Booking): number {
    return (
      this.distanceScore(driver, booking) * 0.5 +
      this.availabilityScore(driver) * 0.3 +
      this.demandScore(booking) * 0.2
    );
  }

  static findBestDriver(
    booking: Booking,
    drivers: Driver[],
  ): MatchResult | null {
    const validDrivers = drivers.filter((d) => d.status !== "offline");

    let best: MatchResult | null = null;

    for (const driver of validDrivers) {
      const score = this.score(driver, booking);

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

  static autoMatch(bookings: Booking[], drivers: Driver[]): MatchResult[] {
    return bookings
      .filter((b) => b.status === "pending")
      .map((b) => this.findBestDriver(b, drivers))
      .filter(Boolean) as MatchResult[];
  }
}

/**
 * ==============================
 * LIVE GPS ADAPTER (FIXED)
 * ==============================
 */
export function createLiveLocation(driver: Driver): LiveLocation {
  return {
    driver_id: driver.id,

    lat: driver.lat,
    lng: driver.lng,

    speed: driver.status === "busy" ? 45 : 0,
    heading: Math.floor(Math.random() * 360),

    updated_at: new Date().toISOString(),
  };
}
