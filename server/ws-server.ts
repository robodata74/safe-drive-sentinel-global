import http from "http";
import WebSocket, { WebSocketServer } from "ws";

/**
 * -----------------------------
 * TYPES
 * -----------------------------
 */
type GPSPayload = {
  driver_id: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
};

type ClientType = "driver" | "dispatcher";

/**
 * -----------------------------
 * SERVER STATE
 * -----------------------------
 */
const server = http.createServer();
const wss = new WebSocketServer({ server });

// store latest driver positions (for dispatch + recovery)
const driverState = new Map<string, GPSPayload>();

// track clients
const clients = new Map<WebSocket, ClientType>();

/**
 * -----------------------------
 * BROADCAST TO DISPATCHERS
 * -----------------------------
 */
function broadcastToDispatchers(data: any) {
  const message = JSON.stringify(data);

  for (const [client, type] of clients.entries()) {
    if (type === "dispatcher" && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

/**
 * -----------------------------
 * MAIN CONNECTION HANDLER
 * -----------------------------
 */
wss.on("connection", (ws) => {
  let clientType: ClientType = "dispatcher";

  clients.set(ws, clientType);

  /**
   * MESSAGE HANDLER
   */
  ws.on("message", (raw: WebSocket.RawData) => {
    try {
      const data = JSON.parse(raw.toString());

      /**
       * REGISTER CLIENT TYPE
       */
      if (data.type === "register") {
        clientType = data.role as ClientType;
        clients.set(ws, clientType);
        return;
      }

      /**
       * DRIVER GPS UPDATE
       */
      if (data.type === "gps_update") {
        const payload: GPSPayload = {
          driver_id: data.driver_id,
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          heading: data.heading,
          timestamp: Date.now(),
        };

        driverState.set(payload.driver_id, payload);

        /**
         * REAL-TIME DISPATCH BROADCAST
         */
        broadcastToDispatchers({
          type: "driver_location_update",
          payload,
        });

        return;
      }

      /**
       * REQUEST CURRENT STATE (new dispatcher joining)
       */
      if (data.type === "get_all_drivers") {
        ws.send(
          JSON.stringify({
            type: "all_driver_states",
            payload: Array.from(driverState.values()),
          }),
        );
      }
    } catch (err) {
      console.error("WS error:", err);
    }
  });

  /**
   * CLEANUP
   */
  ws.on("close", () => {
    clients.delete(ws);
  });
});

/**
 * -----------------------------
 * START SERVER
 * -----------------------------
 */
const PORT = 4001;

server.listen(PORT, () => {
  console.log(`🚀 SafeDrive WebSocket GPS running on ws://localhost:${PORT}`);
});
