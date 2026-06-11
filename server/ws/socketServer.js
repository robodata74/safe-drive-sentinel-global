const { WebSocketServer, WebSocket } = require("ws");
const { PORT } = require("../lib/config");
const redis = require("../lib/redisClient");
const { publish, subscribe, CHANNELS } = require("../lib/redisPubSub");

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 1024 * 512,
  perMessageDeflate: false,
});

console.log("🚀 SOCKET SERVER RUNNING ON", PORT);

/**
 * CONNECTIONS
 */
const connections = new Map();

/**
 * REDIS → CROSS SERVER STREAM
 */
subscribe(CHANNELS.GPS, (payload) => {
  const msg = JSON.stringify(payload);

  for (const conn of connections.values()) {
    try {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(msg);
      }
    } catch {}
  }
});

/**
 * HEARTBEAT
 */
setInterval(() => {
  const now = Date.now();

  for (const [id, conn] of connections.entries()) {
    const ws = conn.ws;

    const dead =
      !ws ||
      ws.readyState !== WebSocket.OPEN ||
      ws.isAlive === false ||
      now - conn.lastPing > 25000;

    if (dead) {
      try {
        ws?.terminate();
      } catch {}
      connections.delete(id);
    }
  }
}, 5000);

/**
 * PING
 */
setInterval(() => {
  for (const conn of connections.values()) {
    try {
      conn.ws.isAlive = false;
      conn.ws.ping();
    } catch {}
  }
}, 15000);

/**
 * CONNECTION HANDLER
 */
wss.on("connection", (ws) => {
  const id = Date.now().toString(36);

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
     * GPS UPDATE
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
       * Redis store (non-blocking)
       */
      try {
        redis
          .set(`driver:${conn.driverId}`, JSON.stringify(payload), "EX", 60)
          .catch(() => {});
      } catch {}

      /**
       * Local broadcast
       */
      for (const c of connections.values()) {
        try {
          if (c.ws.readyState === WebSocket.OPEN) {
            c.ws.send(JSON.stringify(payload));
          }
        } catch {}
      }

      /**
       * Cross-server broadcast
       */
      publish(CHANNELS.GPS, payload);
    }
  });

  ws.on("close", () => connections.delete(id));
  ws.on("error", () => connections.delete(id));
});
