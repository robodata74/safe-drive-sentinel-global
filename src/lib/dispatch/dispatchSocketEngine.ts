import { WebSocket } from "ws";
import { gpsStream } from "../gps/gpsStream";
import { dispatchAICore } from "./dispatchAICore";

/**
 * =========================
 * TYPES
 * =========================
 */
interface ConnectedDriver {
  driverId: string;
  socket: WebSocket;
}

interface GPSPayload {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

/**
 * =========================
 * SOCKET ENGINE (FIXED)
 * =========================
 */
class DispatchSocketEngine {
  private drivers = new Map<string, ConnectedDriver>();

  /**
   * CONNECT DRIVER
   */
  connectDriver(driverId: string, socket: WebSocket): void {
    if (!driverId || typeof driverId !== "string") {
      socket.close();
      return;
    }

    this.drivers.set(driverId, {
      driverId,
      socket,
    });

    console.log(`🔌 Driver connected: ${driverId}`);

    this.send(driverId, {
      type: "connected",
      driverId,
    });

    dispatchAICore.trigger();
  }

  /**
   * GPS UPDATE
   */
  handleGPSUpdate(payload: GPSPayload): void {
    if (
      !payload?.driverId ||
      typeof payload.lat !== "number" ||
      typeof payload.lng !== "number"
    ) {
      return;
    }

    gpsStream.push({
      userId: payload.driverId,
      role: "driver",
      lat: payload.lat,
      lng: payload.lng,
      speed: payload.speed,
      heading: payload.heading,
      timestamp: payload.timestamp ?? Date.now(),
    });

    /**
     * trigger AI instantly
     */
    dispatchAICore.trigger();
  }

  /**
   * SEND TO DRIVER
   */
  send(driverId: string, payload: any): void {
    const driver = this.drivers.get(driverId);

    if (!driver) return;

    if (driver.socket.readyState === WebSocket.OPEN) {
      driver.socket.send(JSON.stringify(payload));
    }
  }

  /**
   * BROADCAST
   */
  broadcast(payload: any): void {
    for (const driver of this.drivers.values()) {
      if (driver.socket.readyState === WebSocket.OPEN) {
        driver.socket.send(JSON.stringify(payload));
      }
    }
  }

  /**
   * DISCONNECT
   */
  disconnectDriver(driverId: string): void {
    this.drivers.delete(driverId);
    dispatchAICore.trigger();

    console.log(`❌ Driver disconnected: ${driverId}`);
  }
}

/**
 * SINGLETON EXPORT
 */
export const dispatchSocketEngine = new DispatchSocketEngine();
