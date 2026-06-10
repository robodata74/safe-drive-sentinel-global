let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let isManuallyClosed = false;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:4001";

export const socketClient = {
  connect(driverId: string, onMessage: (data: any) => void) {
    // prevent duplicate reconnect loops
    if (socket?.readyState === WebSocket.OPEN) return;

    isManuallyClosed = false;

    const ws = new WebSocket(SOCKET_URL);
    socket = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "connect",
          payload: { driverId },
        }),
      );

      // clear reconnect timer once connected
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      socket = null;

      if (isManuallyClosed) return;

      // safe single reconnect loop
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          this.connect(driverId, onMessage);
        }, 3000);
      }
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };
  },

  sendGPS(lat: number, lng: number, speed?: number, heading?: number) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "gps_update",
        payload: { lat, lng, speed, heading },
      }),
    );
  },

  ping() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ type: "ping" }));
  },

  disconnect() {
    isManuallyClosed = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    socket?.close();
    socket = null;
  },
};
