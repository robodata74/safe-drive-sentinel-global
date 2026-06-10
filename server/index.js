const { WebSocketServer, WebSocket } = require("ws");
const {
  dispatchSocketManager,
} = require("../src/lib/dispatch/dispatchSocketManager");

const PORT = process.env.PORT || process.env.SOCKET_PORT || 4001;

const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 512 * 1024,
  clientTracking: true,
});

console.log(`🚀 SOCKET SERVER LIVE ON PORT ${PORT}`);

const connections = new Map();

/**
 * CLEANUP LOOP
 */
setInterval(() => {
  const now = Date.now();

  for (const [id, conn] of connections.entries()) {
    const dead = now - conn.lastPing > 20000;

    if (!dead) continue;

    try {
      conn.closed = true;
      conn.ws.terminate();
    } catch {}

    connections.delete(id);

    if (conn.driverId) {
      dispatchSocketManager.disconnectDriver(conn.driverId);
    }

    console.log(`💀 CLEANED: ${conn.driverId || id}`);
  }
}, 5000);

wss.on("connection", (ws) => {
  const id = Date.now() + "-" + Math.random();

  const conn = {
    ws,
    lastPing: Date.now(),
    driverId: null,
    lastGpsUpdate: 0,
    closed: false,
  };

  connections.set(id, conn);

  ws.on("message", (msg) => {
    if (conn.closed) return;

    let data;

    try {
      data = JSON.parse(msg.toString());
    } catch {
      return;
    }

    conn.lastPing = Date.now();

    /**
     * PING
     */
    if (data.type === "ping") {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "pong", t: Date.now() }));
      }
      return;
    }

    /**
     * CONNECT
     */
    if (data.type === "connect") {
      const driverId = data.payload?.driverId;

      if (!driverId) return;

      conn.driverId = driverId;

      dispatchSocketManager.connectDriver(driverId, (payload) => {
        if (conn.closed) return;

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(payload));
        }
      });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "connected", driverId }));
      }

      return;
    }

    /**
     * GPS UPDATE
     */
    if (data.type === "gps_update") {
      if (!conn.driverId) return;

      const now = Date.now();

      if (now - conn.lastGpsUpdate < 500) return;

      conn.lastGpsUpdate = now;

      dispatchSocketManager.handleLocationUpdate({
        driverId: conn.driverId,
        ...data.payload,
      });
    }
  });

  ws.on("close", () => {
    conn.closed = true;

    if (conn.driverId) {
      dispatchSocketManager.disconnectDriver(conn.driverId);
    }

    connections.delete(id);
  });

  ws.on("error", () => {
    conn.closed = true;
    connections.delete(id);
  });
});
