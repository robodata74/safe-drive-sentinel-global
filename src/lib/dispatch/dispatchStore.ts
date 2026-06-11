import {
  DispatchEngine,
  type Booking,
  type Driver,
  type MatchResult,
} from "./dispatchEngine";

/**
 * =========================
 * TYPES
 * =========================
 */

export interface DispatchLog {
  id: string;
  type:
    | "driver_added"
    | "driver_updated"
    | "driver_removed"
    | "booking_created"
    | "booking_updated"
    | "booking_assigned"
    | "booking_completed"
    | "driver_offline"
    | "auto_match"
    | "reassign_triggered";
  timestamp: string;
  bookingId?: string;
  driverId?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchSnapshot {
  drivers: Driver[];
  bookings: Booking[];
}

/**
 * =========================
 * MEMORY SAFE + BATCHED DISPATCH STORE
 * =========================
 */
class DispatchStore {
  private drivers = new Map<string, Driver>();
  private bookings = new Map<string, Booking>();

  private logs: DispatchLog[] = [];
  private assignedDrivers = new Set<string>();

  private listeners = new Set<() => void>();

  /**
   * =========================
   * BATCHING ENGINE (CRITICAL FIX)
   * =========================
   */
  private dirty = false;
  private scheduled = false;

  private snapshotCache: DispatchSnapshot | null = null;
  private cacheDirty = true;

  /**
   * =========================
   * SUBSCRIPTION SYSTEM
   * =========================
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * =========================
   * NOTIFY (FRAME BATCHED)
   * =========================
   */
  private notify(): void {
    this.dirty = true;

    if (this.scheduled) return;

    this.scheduled = true;

    requestAnimationFrame(() => {
      this.scheduled = false;

      if (!this.dirty) return;
      this.dirty = false;

      this.listeners.forEach((l) => {
        try {
          l();
        } catch (err) {
          console.error("[DispatchStore listener error]", err);
        }
      });
    });
  }

  /**
   * =========================
   * DRIVER OPS
   * =========================
   */
  addOrUpdateDriver(driver: Driver): void {
    const existing = this.drivers.get(driver.id);

    this.drivers.set(driver.id, {
      ...existing,
      ...driver,
    });

    this.cacheDirty = true;

    this.log({
      type: existing ? "driver_updated" : "driver_added",
      driverId: driver.id,
    });

    this.notify();
  }

  markDriverOffline(driverId: string): void {
    const driver = this.drivers.get(driverId);
    if (!driver) return;

    this.drivers.set(driverId, {
      ...driver,
      status: "offline",
      active_booking_id: undefined,
    });

    this.assignedDrivers.delete(driverId);
    this.cacheDirty = true;

    this.log({
      type: "driver_offline",
      driverId,
    });

    this.notify();
  }

  removeDriver(driverId: string): void {
    this.drivers.delete(driverId);
    this.assignedDrivers.delete(driverId);
    this.cacheDirty = true;

    this.log({
      type: "driver_removed",
      driverId,
    });

    this.notify();
  }

  /**
   * =========================
   * BOOKINGS
   * =========================
   */
  createBooking(booking: Booking): void {
    this.bookings.set(booking.id, booking);
    this.cacheDirty = true;

    this.log({
      type: "booking_created",
      bookingId: booking.id,
    });

    this.runAutoMatch();
    this.notify();
  }

  updateBooking(bookingId: string, updates: Partial<Booking>): void {
    const booking = this.bookings.get(bookingId);
    if (!booking) return;

    this.bookings.set(bookingId, { ...booking, ...updates });

    this.cacheDirty = true;

    this.log({
      type: "booking_updated",
      bookingId,
    });

    this.notify();
  }

  completeBooking(bookingId: string): void {
    const booking = this.bookings.get(bookingId);
    if (!booking) return;

    this.bookings.set(bookingId, {
      ...booking,
      status: "completed",
    });

    const driver = booking.assigned_driver_id
      ? this.drivers.get(booking.assigned_driver_id)
      : null;

    if (driver) {
      this.drivers.set(driver.id, {
        ...driver,
        status: "available",
        active_booking_id: undefined,
      });

      this.assignedDrivers.delete(driver.id);
    }

    this.cacheDirty = true;

    this.log({
      type: "booking_completed",
      bookingId,
    });

    this.notify();
  }

  /**
   * =========================
   * AUTO MATCH (OPTIMIZED LOOP)
   * =========================
   */
  runAutoMatch(): MatchResult[] {
    const availableDrivers: Driver[] = [];
    const pendingBookings: Booking[] = [];

    for (const d of this.drivers.values()) {
      if (d.status === "available" && !this.assignedDrivers.has(d.id)) {
        availableDrivers.push(d);
      }
    }

    for (const b of this.bookings.values()) {
      if (b.status === "pending") {
        pendingBookings.push(b);
      }
    }

    const matches = DispatchEngine.autoMatch(pendingBookings, availableDrivers);

    if (matches.length === 0) return [];

    for (const m of matches) {
      this.assignDriver(m.bookingId, m.driverId);
    }

    this.log({
      type: "auto_match",
      metadata: { totalMatches: matches.length },
    });

    this.cacheDirty = true;
    this.notify();

    return matches;
  }

  /**
   * =========================
   * ASSIGN DRIVER
   * =========================
   */
  assignDriver(bookingId: string, driverId: string): boolean {
    const booking = this.bookings.get(bookingId);
    const driver = this.drivers.get(driverId);

    if (!booking || !driver) return false;
    if (this.assignedDrivers.has(driverId)) return false;

    this.bookings.set(bookingId, {
      ...booking,
      status: "assigned",
      assigned_driver_id: driverId,
    });

    this.drivers.set(driverId, {
      ...driver,
      status: "busy",
      active_booking_id: bookingId,
    });

    this.assignedDrivers.add(driverId);
    this.cacheDirty = true;

    this.log({
      type: "booking_assigned",
      bookingId,
      driverId,
    });

    return true;
  }

  /**
   * =========================
   * GETTERS (CACHED SNAPSHOT)
   * =========================
   */
  getDrivers(): Driver[] {
    return Array.from(this.drivers.values());
  }

  getBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  getLogs(): DispatchLog[] {
    return this.logs;
  }

  getSnapshot(): DispatchSnapshot {
    if (!this.cacheDirty && this.snapshotCache) {
      return this.snapshotCache;
    }

    this.snapshotCache = {
      drivers: this.getDrivers(),
      bookings: this.getBookings(),
    };

    this.cacheDirty = false;

    return this.snapshotCache;
  }

  /**
   * =========================
   * LOGGING (RING BUFFER SAFE)
   * =========================
   */
  private log(data: Omit<DispatchLog, "id" | "timestamp">): void {
    this.logs.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...data,
    });

    if (this.logs.length > 5000) {
      this.logs.splice(0, 1000);
    }
  }
}

export const dispatchStore = new DispatchStore();
