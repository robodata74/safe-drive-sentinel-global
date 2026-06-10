import { dispatchStore } from "./dispatchStore";

export interface DriverLocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

type SocketCallback = (data: unknown) => void;

/**
 * =========================
 * REALTIME DISPATCH SOCKET MANAGER
 * =========================
 *
 * Handles:
 * - GPS streaming
 * - driver updates
 * - live dispatch triggers
 */
class DispatchSocketManager {
  private sockets: Map<string, SocketCallback> = new Map();

  /**
   * DRIVER CONNECT
   */
  connectDriver(driverId: string, socketSend: SocketCallback) {
    this.sockets.set(driverId, socketSend);

    console.log(`[SOCKET] Driver connected: ${driverId}`);
  }

  /**
   * DRIVER DISCONNECT
   */
  disconnectDriver(driverId: string) {
    this.sockets.delete(driverId);

    dispatchStore.markDriverOffline(driverId);

    console.log(`[SOCKET] Driver disconnected: ${driverId}`);
  }

  /**
   * GPS UPDATE STREAM (CORE LOGIC)
   */
  handleLocationUpdate(update: DriverLocationUpdate) {
    const { driverId, lat, lng, speed, heading } = update;

    // 1. Update driver in dispatch store
    dispatchStore.addOrUpdateDriver({
      id: driverId,
      status: "available",
      location: { lat, lng },
      lastSeen: update.timestamp,
    });

    // 2. OPTIONAL: trigger smart re-match (lightweight AI)
    this.triggerSmartRebalance(driverId);

    // 3. Broadcast to driver (ack)
    this.emit(driverId, {
      type: "gps_ack",
      lat,
      lng,
      speed,
      heading,
    });
  }

  /**
   * SMART REBALANCE (LIGHT AI TRIGGER)
   *
   * Only triggers when needed (prevents overload)
   */
  private triggerSmartRebalance(driverId: string) {
    const driver = dispatchStore.getDrivers().find((d) => d.id === driverId);

    if (!driver) return;

    const activeBookingId = (driver as any).active_booking_id;

    // Only rebalance if driver is idle
    if (!activeBookingId && driver.status === "available") {
      dispatchStore.runAutoMatch();
    }
  }

  /**
   * SEND MESSAGE TO DRIVER
   */
  emit(driverId: string, payload: unknown) {
    const socket = this.sockets.get(driverId);

    if (socket) {
      socket(payload);
    }
  }

  /**
   * BROADCAST TO ALL DRIVERS
   */
  broadcast(payload: unknown) {
    this.sockets.forEach((socket) => socket(payload));
  }
}

/**
 * =========================
 * SINGLETON EXPORT
 * =========================
 */
export const dispatchSocketManager = new DispatchSocketManager();
