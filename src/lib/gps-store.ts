import type { LiveLocation } from "@/types";

const MAX_HISTORY_PER_VEHICLE = 50;
const MAX_ACTIVE_VEHICLES = 1000;

class GPSStore {
  private activeLocations: Map<string, LiveLocation>;
  private locationHistory: Map<string, LiveLocation[]>;

  constructor() {
    const globalAny = globalThis as any;

    if (!globalAny.__GPS_STORE__) {
      globalAny.__GPS_STORE__ = {
        active: new Map<string, LiveLocation>(),
        history: new Map<string, LiveLocation[]>(),
      };
    }

    this.activeLocations = globalAny.__GPS_STORE__.active;
    this.locationHistory = globalAny.__GPS_STORE__.history;
  }

  updateLocation(payload: Omit<LiveLocation, "updated_at">): LiveLocation {
    const location: LiveLocation = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    this.activeLocations.set(location.flatbed_id, location);

    if (this.activeLocations.size > MAX_ACTIVE_VEHICLES) {
      const oldestKey = this.activeLocations.keys().next().value;
      if (oldestKey) this.activeLocations.delete(oldestKey);
    }

    const history = this.locationHistory.get(location.flatbed_id) || [];
    history.push(location);

    this.locationHistory.set(
      location.flatbed_id,
      history.slice(-MAX_HISTORY_PER_VEHICLE),
    );

    return location;
  }

  getLocation(id: string): LiveLocation | null {
    return this.activeLocations.get(id) ?? null;
  }

  getAllLocations(): LiveLocation[] {
    return Array.from(this.activeLocations.values());
  }

  getHistory(id: string): LiveLocation[] {
    return this.locationHistory.get(id) ?? [];
  }

  removeLocation(id: string): boolean {
    this.locationHistory.delete(id);
    return this.activeLocations.delete(id);
  }

  cleanupInactive(timeoutMinutes = 30): number {
    const now = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;

    let removed = 0;

    for (const [id, loc] of this.activeLocations.entries()) {
      const lastUpdate = new Date(loc.updated_at).getTime();

      if (now - lastUpdate > timeoutMs) {
        this.activeLocations.delete(id);
        this.locationHistory.delete(id);
        removed++;
      }
    }

    return removed;
  }

  reset() {
    this.activeLocations.clear();
    this.locationHistory.clear();
  }
}

declare global {
  var __GPS_STORE__:
    | {
        active: Map<string, LiveLocation>;
        history: Map<string, LiveLocation[]>;
      }
    | undefined;
}

export const gpsStore = new GPSStore();
