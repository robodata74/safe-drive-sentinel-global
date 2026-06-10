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

export type DispatchEventType =
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

export interface DispatchLog {
  id: string;
  type: DispatchEventType;
  timestamp: string;
  bookingId?: string;
  driverId?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchSnapshot {
  drivers: Driver[];
  bookings: Booking[];
  logs: DispatchLog[];
}

/**
 * =========================
 * CENTRAL DISPATCH STORE
 * =========================
 * Production-grade in-memory dispatch orchestrator
 */
class DispatchStore {
  private drivers = new Map<string, Driver>();
  private bookings = new Map<string, Booking>();
  private logs: DispatchLog[] = [];

  private assignedDrivers = new Set<string>();
  private listeners = new Set<() => void>();

  /**
   * =========================
   * SUBSCRIPTIONS
   * =========================
   */

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  /**
   * =========================
   * DRIVER MANAGEMENT
   * =========================
   */

  addOrUpdateDriver(driver: Driver): void {
    const existing = this.drivers.get(driver.id);

    const updated: Driver = {
      ...existing,
      ...driver,
    };

    this.drivers.set(driver.id, updated);

    this.log({
      type: existing ? "driver_updated" : "driver_added",
      driverId: driver.id,
      metadata: {
        status: updated.status,
        location: updated.location,
      },
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

    this.log({
      type: "driver_offline",
      driverId,
    });

    this.reassignDriver(driverId);
    this.notify();
  }

  removeDriver(driverId: string): void {
    this.drivers.delete(driverId);
    this.assignedDrivers.delete(driverId);

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

    this.bookings.set(bookingId, {
      ...booking,
      ...updates,
    });

    this.log({
      type: "booking_updated",
      bookingId,
      metadata: updates,
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

    const driver = Array.from(this.drivers.values()).find(
      (d) => d.active_booking_id === bookingId,
    );

    if (driver) {
      this.drivers.set(driver.id, {
        ...driver,
        status: "available",
        active_booking_id: undefined,
      });

      this.assignedDrivers.delete(driver.id);
    }

    this.log({
      type: "booking_completed",
      bookingId,
    });

    this.notify();
  }

  /**
   * =========================
   * AUTO MATCH ENGINE
   * =========================
   */

  runAutoMatch(): MatchResult[] {
    const availableDrivers = Array.from(this.drivers.values()).filter(
      (d) => d.status === "available" && !this.assignedDrivers.has(d.id),
    );

    const pendingBookings = Array.from(this.bookings.values()).filter(
      (b) => b.status === "pending",
    );

    const matches = DispatchEngine.autoMatch(pendingBookings, availableDrivers);

    for (const match of matches) {
      this.assignDriver(match.bookingId, match.driverId);
    }

    this.log({
      type: "auto_match",
      metadata: {
        totalMatches: matches.length,
      },
    });

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

    if (booking.status === "assigned" || this.assignedDrivers.has(driverId)) {
      return false;
    }

    this.bookings.set(bookingId, {
      ...booking,
      status: "assigned",
    });

    this.drivers.set(driverId, {
      ...driver,
      status: "busy",
      active_booking_id: bookingId,
    });

    this.assignedDrivers.add(driverId);

    this.log({
      type: "booking_assigned",
      bookingId,
      driverId,
      metadata: {
        assigned_at: new Date().toISOString(),
      },
    });

    this.notify();

    return true;
  }

  /**
   * =========================
   * REASSIGNMENT ENGINE
   * =========================
   */

  private reassignDriver(driverId: string): void {
    const affected = Array.from(this.bookings.values()).filter(
      (b) => b.status === "assigned",
    );

    for (const booking of affected) {
      const driver = this.drivers.get(driverId);

      if (driver?.active_booking_id === booking.id) {
        this.bookings.set(booking.id, {
          ...booking,
          status: "pending",
        });

        this.log({
          type: "reassign_triggered",
          bookingId: booking.id,
          driverId,
        });
      }
    }

    this.runAutoMatch();
  }

  /**
   * =========================
   * GETTERS
   * =========================
   */

  getDrivers(): Driver[] {
    return Array.from(this.drivers.values());
  }

  getBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  getLogs(): DispatchLog[] {
    return [...this.logs];
  }

  getSnapshot(): DispatchSnapshot {
    return {
      drivers: this.getDrivers(),
      bookings: this.getBookings(),
      logs: this.getLogs(),
    };
  }

  /**
   * =========================
   * LOGGING ENGINE
   * =========================
   */

  private log(data: Omit<DispatchLog, "id" | "timestamp">): void {
    this.logs.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...data,
    });

    if (this.logs.length > 10000) {
      this.logs.pop();
    }
  }
}

/**
 * =========================
 * SINGLETON EXPORT
 * =========================
 */

export const dispatchStore = new DispatchStore();
