import { userMemory } from "@/lib/ai/userMemory";
import { dispatchStore } from "@/lib/dispatch/dispatchStore";

export interface GPSPoint {
  userId: string;
  role: "driver" | "customer";
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

/**
 * =========================
 * GPS STREAM ENGINE (PRODUCTION HARDENED)
 * =========================
 * Features:
 * - Anti-spam throttling
 * - Haversine distance validation (real-world accuracy)
 * - Movement anomaly detection
 * - Last-known state caching
 * - AI memory sync
 * - Dispatch integration (drivers only)
 */
class GPSStreamEngine {
  private lastUpdate = new Map<string, number>();
  private lastKnownLocation = new Map<string, GPSPoint>();

  // =========================
  // THROTTLE CONTROL
  // =========================
  private canUpdate(userId: string, now: number): boolean {
    const last = this.lastUpdate.get(userId) ?? 0;

    // 1.5 second throttle (balanced real-time + battery safety)
    if (now - last < 1500) return false;

    this.lastUpdate.set(userId, now);
    return true;
  }

  // =========================
  // REAL-WORLD DISTANCE CHECK (HAVERSINE)
  // =========================
  private getDistanceMeters(a: GPSPoint, b: GPSPoint): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (x: number) => (x * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);

    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // =========================
  // ANTI-SPOOF / ANTI-JUMP VALIDATION
  // =========================
  private isValidMovement(
    oldPoint: GPSPoint | undefined,
    newPoint: GPSPoint,
  ): boolean {
    if (!oldPoint) return true;

    const distance = this.getDistanceMeters(oldPoint, newPoint);

    // Reject extreme teleportation (> 500 meters per update cycle)
    if (distance > 500) {
      console.warn("⚠️ GPS anomaly blocked (jump detected):", {
        userId: newPoint.userId,
        distance,
      });
      return false;
    }

    return true;
  }

  // =========================
  // MAIN INGESTION PIPELINE
  // =========================
  push(point: GPSPoint): void {
    const now = Date.now();

    // STEP 1: THROTTLE
    if (!this.canUpdate(point.userId, now)) return;

    // STEP 2: VALIDATE INPUT
    if (typeof point.lat !== "number" || typeof point.lng !== "number") {
      return;
    }

    const previous = this.lastKnownLocation.get(point.userId);

    // STEP 3: ANTI-JUMP CHECK
    if (!this.isValidMovement(previous, point)) {
      return;
    }

    // STEP 4: STORE LAST KNOWN LOCATION
    this.lastKnownLocation.set(point.userId, point);

    // STEP 5: AI MEMORY UPDATE
    userMemory.updateLocation(point.userId, point.lat, point.lng);

    // STEP 6: DISPATCH SYSTEM SYNC (DRIVERS ONLY)
    if (point.role === "driver") {
      const drivers = dispatchStore.getDrivers();

      const driver = drivers.find((d) => d.id === point.userId);

      if (driver) {
        dispatchStore.addOrUpdateDriver({
          ...driver,
          location: {
            lat: point.lat,
            lng: point.lng,
          },
          lastSeen: point.timestamp,
        });
      }
    }

    // STEP 7: CUSTOMER LOCATION CACHE (FUTURE AI ETA LAYER)
    if (point.role === "customer") {
      // reserved for:
      // - ETA prediction engine
      // - nearest driver matching
      // - heatmap analytics
    }
  }

  // =========================
  // BULK SIMULATION MODE
  // =========================
  pushBatch(points: GPSPoint[]): void {
    for (const p of points) {
      this.push(p);
    }
  }

  // =========================
  // DEBUG / ANALYTICS
  // =========================
  getLastLocation(userId: string): GPSPoint | undefined {
    return this.lastKnownLocation.get(userId);
  }

  getAllLastLocations(): Map<string, GPSPoint> {
    return this.lastKnownLocation;
  }
}

/**
 * =========================
 * SINGLETON EXPORT
 * =========================
 */
export const gpsStream = new GPSStreamEngine();
