"use client";

import { useEffect, useRef, useState } from "react";

export type LiveDriverUpdate = {
  driver_id: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
};

type IncomingMessage =
  | {
      type: "driver_location_update";
      payload: LiveDriverUpdate;
    }
  | {
      type: "all_driver_states";
      payload: LiveDriverUpdate[];
    };

interface UseGpsSocketOptions {
  url: string;
  onDriverUpdate?: (data: LiveDriverUpdate) => void;
  onBulkUpdate?: (data: LiveDriverUpdate[]) => void;
}

export function useGpsSocket({
  url,
  onDriverUpdate,
  onBulkUpdate,
}: UseGpsSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);

      ws.send(
        JSON.stringify({
          type: "register",
          role: "dispatcher",
        }),
      );

      ws.send(
        JSON.stringify({
          type: "get_all_drivers",
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg: IncomingMessage = JSON.parse(event.data);

        if (msg.type === "driver_location_update") {
          onDriverUpdate?.(msg.payload);
        }

        if (msg.type === "all_driver_states") {
          onBulkUpdate?.(msg.payload);
        }
      } catch (err) {
        console.error("GPS socket parse error:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error("GPS socket error:", err);
    };

    return () => {
      ws.close();
    };
  }, [url, onDriverUpdate, onBulkUpdate]);

  return {
    connected,
  };
}
