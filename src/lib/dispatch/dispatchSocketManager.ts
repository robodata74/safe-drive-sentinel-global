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
 * ==========================================================
 * SAFE DRIVE GLOBAL — REALTIME ENGINE v4 (STABLE CORE)
 * FINAL STEP 7: DETERMINISTIC DISPATCH PIPELINE
 * ==========================================================
 */
class DispatchSocketManager {
  private sockets = new Map<string, SocketCallback>();

  /**
   * ======================================================
   * GPS BUFFER SYSTEM (LATEST-WINS RULE)
   * ======================================================
   */
  private buffer = new Map<string, DriverLocationUpdate>();
  private lastProcessed = new Map<string, number>();

  private readonly MIN_INTERVAL_MS = 1000;

  /**
   * ======================================================
   * AUTO MATCH SINGLE-FLIGHT LOCK
   * ======================================================
   */
  private matchInProgress = false;
  private matchQueued = false;

  private readonly MATCH_DEBOUNCE_MS = 1200;
  private matchTimer: NodeJS.Timeout | null = null;

  /**
   * ======================================================
   * DRIVER CONNECT
   * ======================================================
   */
  connectDriver(driverId: string, socketSend: SocketCallback) {
    this.sockets.set(driverId, socketSend);
    console.log(`[SOCKET] Driver connected: ${driverId}`);
  }

  /**
   * ======================================================
   * DRIVER DISCONNECT (CLEAN STATE RESET ONLY)
   * ======================================================
   */
  disconnectDriver(driverId: string) {
    this.sockets.delete(driverId);
    this.buffer.delete(driverId);
    this.lastProcessed.delete(driverId);

    dispatchStore.markDriverOffline(driverId);

    console.log(`[SOCKET] Driver disconnected: ${driverId}`);
  }

  /**
   * ======================================================
   * GPS ENTRY POINT (CONTROLLED INGEST LAYER)
   * ======================================================
   */
  handleLocationUpdate(update: DriverLocationUpdate) {
    const last = this.lastProcessed.get(update.driverId) || 0;

    /**
     * If updates are too fast → store only latest
     */
    if (update.timestamp - last < this.MIN_INTERVAL_MS) {
      this.buffer.set(update.driverId, update);
      return;
    }

    this.lastProcessed.set(update.driverId, update.timestamp);

    const buffered = this.buffer.get(update.driverId);
    this.buffer.delete(update.driverId);

    const finalUpdate = buffered ?? update;

    this.processUpdate(finalUpdate);
  }

  /**
   * ======================================================
   * CORE PROCESSOR (NO SIDE EFFECT CHAOS)
   * ======================================================
   */
  private processUpdate(update: DriverLocationUpdate) {
    const { driverId, lat, lng, speed, heading, timestamp } = update;

    const existingDriver = dispatchStore
      .getDrivers()
      .find((d) => d.id === driverId);

    /**
     * IMPORTANT RULE:
     * Only update LOCATION + lastSeen
     * DO NOT overwrite status (prevents dispatch corruption)
     */
    dispatchStore.addOrUpdateDriver({
      id: driverId,
      location: { lat, lng },
      lastSeen: timestamp,

      // preserve existing state if present
      status: existingDriver?.status ?? "available",

      speed,
      heading,
    });

    /**
     * Trigger safe match pipeline
     */
    this.scheduleAutoMatch();

    /**
     * ACK BACK TO DRIVER
     */
    this.emit(driverId, {
      type: "gps_ack",
      lat,
      lng,
      speed,
      heading,
      timestamp,
    });
  }

  /**
   * ======================================================
   * AUTO MATCH (SAFE DEBOUNCED SINGLE-FLIGHT EXECUTION)
   * ======================================================
   */
  private scheduleAutoMatch() {
    if (this.matchTimer) return;

    this.matchTimer = setTimeout(() => {
      this.matchTimer = null;
      this.runSafeMatch();
    }, this.MATCH_DEBOUNCE_MS);
  }

  private runSafeMatch() {
    if (this.matchInProgress) {
      this.matchQueued = true;
      return;
    }

    this.matchInProgress = true;

    try {
      dispatchStore.runAutoMatch();
    } catch (err) {
      console.error("[Dispatch AutoMatch Error]", err);
    }

    this.matchInProgress = false;

    if (this.matchQueued) {
      this.matchQueued = false;
      this.scheduleAutoMatch();
    }
  }

  /**
   * ======================================================
   * EMIT (SAFE SOCKET WRITE)
   * ======================================================
   */
  emit(driverId: string, payload: unknown) {
    const socket = this.sockets.get(driverId);
    if (!socket) return;

    try {
      socket(payload);
    } catch (err) {
      console.error("[Socket Emit Error]", err);
    }
  }

  /**
   * ======================================================
   * BROADCAST (GLOBAL OPS CHANNEL)
   * ======================================================
   */
  broadcast(payload: unknown) {
    for (const socket of this.sockets.values()) {
      try {
        socket(payload);
      } catch (err) {
        console.error("[Broadcast Error]", err);
      }
    }
  }
}

export const dispatchSocketManager = new DispatchSocketManager();
