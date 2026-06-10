import { WebSocket, WebSocketServer } from "ws";
import { dispatchSocketManager } from "../src/lib/dispatch/dispatchSocketManager";

/**
 * ==========================================================
 * SAFEDRIVE GLOBAL SOCKET ENGINE
 * PRODUCTION REALTIME BACKBONE (HARDENED v1)
 * ==========================================================
 */

interface DriverSocketMessage {
  type: "gps_update" | "connect" | "disconnect" | "ping";
  payload: any;
}

const PORT = Number(process.env.SOCKET_PORT ?? 4001);

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 1024 * 1024, // 1MB safety cap
});

console.log(`🚀 SOCKET ENGINE LIVE ws://localhost:${PORT}`);

/**
 * ==========================================================
 * CONNECTION REGISTRY
 * ==========================================================
 */

type Connection = {
  ws: WebSocket;
  lastPing: number;
  driverId?: string;
  isAlive: boolean;
};

const connections = new Map<string, Connection>();

/**
 * ==========================================================
 * HEARTBEAT (GLOBAL CLEANER)
 * ==========================================================
 */

setInterval(() => {
  const now = Date.now();

  for (const [id, conn] of connections.entries()) {
    const timeout = now - conn.lastPing > 20000;

    if (timeout || !conn.isAlive) {
      try {
        conn.ws.terminate();
      } catch {}

      connections.delete(id);

      if (conn.driverId) {
        dispatchSocketManager.disconnectDriver(conn.driverId);
      }

      console.log(`💀 SOCKET REMOVED: ${conn.driverId ?? id}`);
    }
  }
}, 5000);

/**
 * ==========================================================
 * CONNECTION HANDLER
 * ==========================================================
 */

wss.on("connection", (ws: WebSocket) => {
  const connectionId = `${Date.now()}-${Math.random()}`;

  const conn: Connection = {
    ws,
    lastPing: Date.now(),
    isAlive: true,
  };

  connections.set(connectionId, conn);

  console.log("🔌 CLIENT CONNECTED");

  /**
   * ======================================================
   * MESSAGE HANDLER
   * ======================================================
   */

  ws.on("message", (message) => {
    try {
      const data: DriverSocketMessage = JSON.parse(message.toString());

      const connection = connections.get(connectionId);
      if (connection) connection.lastPing = Date.now();

      /**
       * =========================
       * PING / HEARTBEAT
       * =========================
       */
      if (data.type === "ping") {
        ws.send(
          JSON.stringify({
            type: "pong",
            timestamp: Date.now(),
          }),
        );

        return;
      }

      /**
       * =========================
       * DRIVER CONNECT
       * =========================
       */
      if (data.type === "connect") {
        const driverId = data.payload?.driverId;

        if (!driverId || typeof driverId !== "string") {
          ws.close();
          return;
        }

        const conn = connections.get(connectionId);

        if (conn) conn.driverId = driverId;

        dispatchSocketManager.connectDriver(driverId, (payload) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
          }
        });

        ws.send(
          JSON.stringify({
            type: "connected",
            driverId,
          }),
        );

        console.log(`🚗 DRIVER ONLINE: ${driverId}`);

        return;
      }

      /**
       * =========================
       * GPS UPDATE PIPELINE
       * =========================
       */
      if (data.type === "gps_update") {
        const conn = connections.get(connectionId);

        if (!conn?.driverId) return;

        const payload = {
          ...data.payload,
          driverId: conn.driverId,
        };

        dispatchSocketManager.handleLocationUpdate(payload);
      }
    } catch (err) {
      console.error("❌ SOCKET ERROR:", err);
    }
  });

  /**
   * ======================================================
   * LIVENESS TRACKING (PONG RESPONSE)
   * ======================================================
   */

  ws.on("pong", () => {
    const conn = connections.get(connectionId);

    if (conn) {
      conn.isAlive = true;
      conn.lastPing = Date.now();
    }
  });

  /**
   * ======================================================
   * DISCONNECT HANDLING
   * ======================================================
   */

  ws.on("close", () => {
    const conn = connections.get(connectionId);

    if (conn?.driverId) {
      dispatchSocketManager.disconnectDriver(conn.driverId);
    }

    connections.delete(connectionId);

    console.log("❌ CLIENT DISCONNECTED");
  });

  /**
   * ======================================================
   * ERROR HANDLING
   * ======================================================
   */

  ws.on("error", (err) => {
    console.error("🔥 SOCKET ERROR:", err);
  });
});
