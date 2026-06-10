import { gpsStream } from "@/lib/dispatch/gps/gpsStream";
import { WebSocket, WebSocketServer } from "ws";

interface ClientMessage {
  type: "connect" | "gps_update" | "heartbeat";
  payload: any;
}

interface ConnectedDriver {
  driverId: string;
  socket: WebSocket;
}

class DispatchSocketEngine {
  private wss: WebSocketServer;
  private drivers = new Map<string, ConnectedDriver>();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    console.log(`🚀 SOCKET ENGINE LIVE ON ws://localhost:${port}`);

    this.init();
  }

  /**
   * =========================
   * INIT SERVER
   * =========================
   */
  private init(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      let driverId: string | null = null;

      console.log("🔌 NEW SOCKET CONNECTION");

      ws.on("message", (msg) => {
        try {
          const data: ClientMessage = JSON.parse(msg.toString());

          /**
           * =========================
           * DRIVER CONNECT
           * =========================
           */
          if (data.type === "connect") {
            const id = data.payload?.driverId;

            if (typeof id !== "string" || !id) {
              ws.close();
              return;
            }

            driverId = id;

            this.drivers.set(driverId, {
              driverId,
              socket: ws,
            });

            ws.send(
              JSON.stringify({
                type: "connected",
                driverId,
              }),
            );

            console.log(`✅ DRIVER CONNECTED: ${driverId}`);
            return;
          }

          /**
           * =========================
           * GPS UPDATE STREAM
           * =========================
           */
          if (data.type === "gps_update" && driverId) {
            gpsStream.push({
              userId: driverId,
              role: "driver",
              lat: data.payload.lat,
              lng: data.payload.lng,
              speed: data.payload.speed,
              heading: data.payload.heading,
              timestamp: Date.now(),
            });

            return;
          }

          /**
           * HEARTBEAT
           */
          if (data.type === "heartbeat") {
            ws.send(JSON.stringify({ type: "alive" }));
          }
        } catch (err) {
          console.error("❌ SOCKET ERROR:", err);
        }
      });

      /**
       * =========================
       * CLEAN DISCONNECT
       * =========================
       */
      ws.on("close", () => {
        if (driverId) {
          this.drivers.delete(driverId);
          console.log(`❌ DRIVER DISCONNECTED: ${driverId}`);
        }
      });
    });
  }

  /**
   * =========================
   * BROADCAST TO ALL DRIVERS
   * =========================
   */
  broadcast(data: any): void {
    for (const driver of this.drivers.values()) {
      if (driver.socket.readyState === WebSocket.OPEN) {
        driver.socket.send(JSON.stringify(data));
      }
    }
  }

  /**
   * =========================
   * SEND TO SPECIFIC DRIVER
   * =========================
   */
  sendToDriver(driverId: string, data: any): void {
    const driver = this.drivers.get(driverId);

    if (!driver) return;

    if (driver.socket.readyState === WebSocket.OPEN) {
      driver.socket.send(JSON.stringify(data));
    }
  }
}

/**
 * =========================
 * SINGLETON ENGINE
 * =========================
 */
export const dispatchSocketEngine = new DispatchSocketEngine(
  Number(process.env.SOCKET_PORT ?? 4001),
);
