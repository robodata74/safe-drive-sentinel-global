require("dotenv").config({
  path: ".env.local",
});

const { WebSocketServer, WebSocket } = require("ws");

// ======================================================
// SAFE IMPORTS (FAIL-RESISTANT)
// ======================================================
let redis = null;
let publish = async () => {};
let subscribe = async () => {};
let CHANNELS = { GPS: "gps" };

try {
  redis = require("./lib/redis");
  console.log("🟢 Redis loaded");
} catch (err) {
  console.warn("⚠️ Redis disabled:", err.message);
}

try {
  ({ publish, subscribe, CHANNELS } = require("./lib/redisPubSub"));

  console.log("🟢 Redis PubSub loaded");
} catch (err) {
  console.warn("⚠️ PubSub disabled:", err.message);
}

// ======================================================
// CONFIG
// ======================================================
const PORT = Number(process.env.SOCKET_PORT || 4001);

const wss = new WebSocketServer({
  port: PORT,
  perMessageDeflate: false,
  maxPayload: 1024 * 512,
});

console.log(`🚀 SOCKET SERVER RUNNING ON ${PORT}`);

// ======================================================
// MEMORY STORE
// ======================================================
const connections = new Map();

// ======================================================
// SAFE SEND
// ======================================================
function safeSend(ws, payload) {
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    ws.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

// ======================================================
// PUBSUB INIT (RECOVERY SAFE)
// ======================================================
let subscribed = false;

async function initPubSub() {
  if (subscribed) return;

  try {
    await subscribe(CHANNELS.GPS, (payload) => {
      for (const { ws } of connections.values()) {
        safeSend(ws, payload);
      }
    });

    subscribed = true;
    console.log("🟢 PubSub GPS active");
  } catch (err) {
    subscribed = false;

    console.error("🔴 PubSub failed:", err?.message || err);

    setTimeout(initPubSub, 3000);
  }
}

initPubSub();

// ======================================================
// HEARTBEAT CLEANUP
// ======================================================
const cleanupInterval = setInterval(() => {
  const now = Date.now();

  for (const [id, conn] of connections.entries()) {
    const ws = conn.ws;

    const dead =
      !ws ||
      ws.readyState !== WebSocket.OPEN ||
      ws.isAlive === false ||
      now - conn.lastPing > 30000;

    if (!dead) continue;

    try {
      ws?.terminate();
    } catch {}

    connections.delete(id);
  }
}, 5000);

// ======================================================
// HEARTBEAT PING
// ======================================================
const pingInterval = setInterval(() => {
  for (const conn of connections.values()) {
    try {
      conn.ws.isAlive = false;
      conn.ws.ping();
    } catch {}
  }
}, 15000);

// ======================================================
// CONNECTION HANDLER
// ======================================================
wss.on("connection", (ws) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  ws.isAlive = true;

  const conn = {
    ws,
    driverId: null,
    lastPing: Date.now(),
  };

  connections.set(id, conn);

  // ---------------------------------------------------
  // HEARTBEAT RESPONSE
  // ---------------------------------------------------
  ws.on("pong", () => {
    ws.isAlive = true;
    conn.lastPing = Date.now();
  });

  // ---------------------------------------------------
  // MESSAGE HANDLER
  // ---------------------------------------------------
  ws.on("message", async (raw) => {
    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (!data?.type) return;

    conn.lastPing = Date.now();

    // ===============================================
    // DRIVER CONNECT
    // ===============================================
    if (data.type === "connect") {
      conn.driverId = data?.payload?.driverId || null;

      safeSend(ws, {
        type: "connected",
        driverId: conn.driverId,
      });

      return;
    }

    // ===============================================
    // GPS UPDATE
    // ===============================================
    if (data.type === "gps_update") {
      if (!conn.driverId) return;

      const p = data.payload || {};

      const lat = Number(p.lat);
      const lng = Number(p.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      const payload = {
        type: "driver_location_update",
        driverId: conn.driverId,
        lat,
        lng,
        speed: Number(p.speed || 0),
        heading: Number(p.heading || 0),
        ts: Date.now(),
      };

      // -------------------------------------------
      // 1. REDIS CACHE
      // -------------------------------------------
      try {
        if (redis?.set) {
          await redis.set(`driver:${conn.driverId}`, JSON.stringify(payload), {
            EX: 60,
          });
        }
      } catch (err) {
        console.warn("Redis SET failed:", err?.message);
      }

      // -------------------------------------------
      // 2. LOCAL BROADCAST
      // -------------------------------------------
      for (const c of connections.values()) {
        safeSend(c.ws, payload);
      }

      // -------------------------------------------
      // 3. CROSS SERVER PUBSUB
      // -------------------------------------------
      try {
        await publish(CHANNELS.GPS, payload);
      } catch (err) {
        console.warn("Redis publish failed:", err?.message);
      }
    }
  });

  // ---------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------
  function destroyConnection() {
    try {
      ws.terminate();
    } catch {}

    connections.delete(id);
  }

  ws.on("close", destroyConnection);
  ws.on("error", destroyConnection);
});

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================
async function shutdown(signal) {
  console.log(`🛑 ${signal} received`);

  clearInterval(cleanupInterval);
  clearInterval(pingInterval);

  try {
    wss.close();
  } catch {}

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED PROMISE:", reason);
});
