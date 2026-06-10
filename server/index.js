const { WebSocketServer, WebSocket } = require("ws");
const { setValue } = require("./lib/redis");
const { publish, subscribe, CHANNELS } = require("./lib/redisPubSub");

const PORT = process.env.PORT || 4001;

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 1024 * 512,
});

console.log("🚀 MULTI-SERVER SOCKET NODE RUNNING ON", PORT);

/**
 * ======================================================
 * LOCAL CONNECTION STORE (PER INSTANCE ONLY)
 * ======================================================
 */
const connections = new Map();

/**
 * ======================================================
 * REDIS → CROSS SERVER EVENT LISTENER
 * ======================================================
 */
subscribe(CHANNELS.GPS, (payload) => {
  // broadcast to local clients only
  const msg = JSON.stringify(payload);

  for (const conn of connections.values()) {
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(msg);
    }
  }
});

/**
 * ======================================================
 * HEARTBEAT CLEANUP
 * ======================================================
 */
setInterval(() => {
  const now = Date.now();

  for (const [id, conn] of connections.entries()) {
    const dead = !conn.ws.isAlive || now - conn.lastPing > 20000;

    if (!dead) continue;

    try {
      conn.ws.terminate();
    } catch {}

    connections.delete(id);
  }
}, 5000);

/**
 * ======================================================
 * HEARTBEAT PING
 * ======================================================
 */
setInterval(() => {
  for (const conn of connections.values()) {
    conn.ws.isAlive = false;
    conn.ws.ping();
  }
}, 15000);

/**
 * ======================================================
 * CONNECTION HANDLER
 * ======================================================
 */
wss.on("connection", (ws) => {
  const id = `${Date.now()}-${Math.random()}`;

  ws.isAlive = true;

  const conn = {
    ws,
    driverId: null,
    lastPing: Date.now(),
  };

  connections.set(id, conn);

  ws.on("pong", () => {
    ws.isAlive = true;
    conn.lastPing = Date.now();
  });

  ws.on("message", async (msg) => {
    let data;

    try {
      data = JSON.parse(msg.toString());
    } catch {
      return;
    }

    conn.lastPing = Date.now();

    /**
     * CONNECT
     */
    if (data.type === "connect") {
      conn.driverId = data?.payload?.driverId;

      ws.send(
        JSON.stringify({
          type: "connected",
          driverId: conn.driverId,
        }),
      );

      return;
    }

    /**
     * GPS UPDATE (MULTI-SERVER SAFE)
     */
    if (data.type === "gps_update") {
      if (!conn.driverId) return;

      const payload = {
        type: "driver_location_update",
        driverId: conn.driverId,
        lat: data.payload?.lat,
        lng: data.payload?.lng,
        speed: data.payload?.speed || 0,
        heading: data.payload?.heading || 0,
        ts: Date.now(),
      };

      /**
       * 1. Store latest state (Redis KV)
       */
      setValue(`driver:${conn.driverId}`, payload, 60).catch(() => {});

      /**
       * 2. LOCAL BROADCAST (same server clients)
       */
      for (const c of connections.values()) {
        if (c.ws.readyState === WebSocket.OPEN) {
          c.ws.send(JSON.stringify(payload));
        }
      }

      /**
       * 3. CROSS-SERVER BROADCAST (CRITICAL)
       */
      publish(CHANNELS.GPS, payload);
    }
  });

  ws.on("close", () => {
    connections.delete(id);
  });

  ws.on("error", () => {
    connections.delete(id);
  });
});
