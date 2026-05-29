/**
 * SafeDrive Sentinel — GPS Store (Production Safe)
 * Optimized for Next.js + Supabase Realtime + MapLibre
 */

export interface GPSLocation {
  flatbed_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

const MAX_HISTORY_PER_VEHICLE = 50;
const MAX_ACTIVE_VEHICLES = 1000;

class GPSStore {
  private activeLocations: Map<string, GPSLocation>;
  private locationHistory: Map<string, GPSLocation[]>;

  constructor() {
    // Prevent duplicate instances in Next.js HMR
    const globalAny = globalThis as any;

    if (!globalAny.__GPS_STORE__) {
      globalAny.__GPS_STORE__ = {
        active: new Map<string, GPSLocation>(),
        history: new Map<string, GPSLocation[]>(),
      };
    }

    this.activeLocations = globalAny.__GPS_STORE__.active;
    this.locationHistory = globalAny.__GPS_STORE__.history;
  }

  /**
   * Update live GPS location
   */
  updateLocation(payload: Omit<GPSLocation, "timestamp">): GPSLocation {
    const location: GPSLocation = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    // -----------------------------
    // 1. Update active location
    // -----------------------------
    this.activeLocations.set(location.flatbed_id, location);

    // -----------------------------
    // 2. Enforce active limit (prevents memory explosion)
    // -----------------------------
    if (this.activeLocations.size > MAX_ACTIVE_VEHICLES) {
      const oldestKey = this.activeLocations.keys().next().value;
      if (oldestKey) this.activeLocations.delete(oldestKey);
    }

    // -----------------------------
    // 3. Update history safely
    // -----------------------------
    const history = this.locationHistory.get(location.flatbed_id) || [];

    history.push(location);

    // keep only last N points
    const trimmed = history.slice(-MAX_HISTORY_PER_VEHICLE);

    this.locationHistory.set(location.flatbed_id, trimmed);

    return location;
  }

  /**
   * Get live location
   */
  getLocation(flatbedId: string): GPSLocation | null {
    return this.activeLocations.get(flatbedId) ?? null;
  }

  /**
   * Get all active vehicles
   */
  getAllLocations(): GPSLocation[] {
    return Array.from(this.activeLocations.values());
  }

  /**
   * Get history
   */
  getHistory(flatbedId: string): GPSLocation[] {
    return this.locationHistory.get(flatbedId) ?? [];
  }

  /**
   * Remove vehicle
   */
  removeLocation(flatbedId: string): boolean {
    this.locationHistory.delete(flatbedId);
    return this.activeLocations.delete(flatbedId);
  }

  /**
   * Cleanup stale vehicles
   */
  cleanupInactive(timeoutMinutes = 30): number {
    const now = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    let removed = 0;

    for (const [id, location] of this.activeLocations.entries()) {
      const lastUpdate = new Date(location.timestamp).getTime();

      if (now - lastUpdate > timeoutMs) {
        this.activeLocations.delete(id);
        this.locationHistory.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Emergency memory reset (useful for dev crashes)
   */
  reset() {
    this.activeLocations.clear();
    this.locationHistory.clear();
  }
}

/**
 * Global singleton (safe across Fast Refresh)
 */
declare global {
  var __GPS_STORE__:
    | {
        active: Map<string, GPSLocation>;
        history: Map<string, GPSLocation[]>;
      }
    | undefined;
}

export const gpsStore = new GPSStore();
