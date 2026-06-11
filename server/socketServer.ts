import { WebSocket, WebSocketServer } from "ws";
import { dispatchSocketManager } from "../src/lib/dispatch/dispatchSocketManager";

/**
 * ==========================================================
 * SAFEDRIVE GLOBAL — SOCKET ENGINE (DEPLOY v7 FINAL)
 * HARDENED REALTIME TRANSPORT LAYER
 * ==========================================================
 */

interface DriverSocketMessage {
  type: "gps_update" | "connect" | "disconnect" | "ping";
  payload?: any;
}

const PORT = Number(process.env.SOCKET_PORT ?? 4001);

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 256 * 1024, // 🔥 reduced for safety
  clientTracking: true,
  perMessageDeflate: false, // 🔥 reduces CPU spikes
});

console.log(`🚀 SOCKET ENGINE LIVE ws://localhost:${PORT}`);

/**
 * ==========================================================
 * CONNECTION STATE
 * ==========================================================
 */

type Connection = {
  ws: WebSocket;
  lastPing: number;
  driverId?: string;
  isAlive: boolean;
  lastGpsUpdate: number;
  closed: boolean;

  // 🔥 backpressure protection
  messageQueue: number;
};

const connections = new Map<string, Connection>();

/**
 * ==========================================================
 * HEARTBEAT PING LOOP (CRITICAL FIX)
 * ==========================================================
 */

const HEARTBEAT_INTERVAL = 10000;

const heartbeat = setInterval(() => {
  for (const [, conn] of connections.entries()) {
    if (!conn.isAlive) {
      try {
        conn.ws.terminate();
      } catch {}
      continue;
    }

    conn.isAlive = false;

    try {
      conn.ws.ping();
    } catch {}
  }
}, HEARTBEAT_INTERVAL);

/**
 * ==========================================================
 * CLEANUP LOOP
 * ==========================================================
 */

setInterval(() => {
  const now = Date.now();

  for (const [id, conn] of connections.entries()) {
    const dead = now - conn.lastPing > 20000 || conn.closed;

    if (!dead) continue;

    conn.closed = true;

    try {
      conn.ws.terminate();
    } catch {}

    connections.delete(id);

    if (conn.driverId) {
      dispatchSocketManager.disconnectDriver(conn.driverId);
    }

    console.log(`💀 SOCKET CLEANED: ${conn.driverId ?? id}`);
  }
}, 5000);

/**
 * ==========================================================
 * CONNECTION HANDLER
 * ==========================================================
 */

wss.on("connection", (ws: WebSocket) => {
  const connectionId = crypto.randomUUID();

  const conn: Connection = {
    ws,
    lastPing: Date.now(),
    isAlive: true,
    lastGpsUpdate: 0,
    closed: false,
    messageQueue: 0,
  };

  connections.set(connectionId, conn);

  console.log("🔌 CLIENT CONNECTED");

  const safeConn = () => connections.get(connectionId);

  /**
   * ======================================================
   * MESSAGE HANDLER
   * ======================================================
   */

  ws.on("message", (message) => {
    const connection = safeConn();
    if (!connection || connection.closed) return;

    // 🔥 BACKPRESSURE GUARD
    connection.messageQueue++;

    if (connection.messageQueue > 50) {
      ws.close(); // kill abusive clients
      return;
    }

    let data: DriverSocketMessage;

    try {
      data = JSON.parse(message.toString());
    } catch {
      connection.messageQueue--;
      return;
    }

    connection.lastPing = Date.now();
    connection.messageQueue--;

    /**
     * =========================
     * PING
     * =========================
     */
    if (data.type === "ping") {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "pong", t: Date.now() }));
      }
      return;
    }

    /**
     * =========================
     * CONNECT DRIVER (LOCKED)
     * =========================
     */
    if (data.type === "connect") {
      const driverId = data.payload?.driverId;

      if (typeof driverId !== "string" || !driverId.trim()) {
        ws.close();
        return;
      }

      // 🔥 HARD LOCK (no rebind)
      if (!connection.driverId) {
        connection.driverId = driverId;
      }

      dispatchSocketManager.connectDriver(driverId, (payload) => {
        const c = safeConn();
        if (!c || c.closed) return;

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(payload));
        }
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "connected", driverId }));
      }

      console.log(`🚗 DRIVER ONLINE: ${driverId}`);
      return;
    }

    /**
     * =========================
     * GPS UPDATE (SANITIZED)
     * =========================
     */
    if (data.type === "gps_update") {
      const c = safeConn();
      if (!c?.driverId) return;

      const now = Date.now();

      if (now - c.lastGpsUpdate < 500) return;

      c.lastGpsUpdate = now;

      // 🔥 SAFE PAYLOAD (no spread corruption)
      const { lat, lng, speed, heading, timestamp } = data.payload || {};

      if (typeof lat !== "number" || typeof lng !== "number") return;

      dispatchSocketManager.handleLocationUpdate({
        driverId: c.driverId,
        lat,
        lng,
        speed,
        heading,
        timestamp: timestamp ?? now,
      });

      return;
    }

    /**
     * =========================
     * DISCONNECT REQUEST
     * =========================
     */
    if (data.type === "disconnect") {
      ws.close();
    }
  });

  /**
   * =========================
   * HEARTBEAT RESPONSE
   * =========================
   */
  ws.on("pong", () => {
    const conn = safeConn();
    if (!conn) return;

    conn.isAlive = true;
    conn.lastPing = Date.now();
  });

  /**
   * =========================
   * CLEAN DISCONNECT
   * =========================
   */
  ws.on("close", () => {
    const conn = safeConn();
    if (!conn) return;

    conn.closed = true;

    if (conn.driverId) {
      dispatchSocketManager.disconnectDriver(conn.driverId);
    }

    connections.delete(connectionId);

    console.log("❌ CLIENT DISCONNECTED");
  });

  ws.on("error", () => {
    const conn = safeConn();
    if (conn) conn.closed = true;

    console.log("🔥 SOCKET ERROR");
  });
});

/**
 * ==========================================================
 * SAFE SHUTDOWN
 * ==========================================================
 */

process.on("SIGTERM", () => {
  console.log("🛑 SHUTDOWN INITIATED");

  clearInterval(heartbeat);

  for (const [, conn] of connections.entries()) {
    try {
      conn.ws.close();
    } catch {}
  }

  process.exit(0);
});
