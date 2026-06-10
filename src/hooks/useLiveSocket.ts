import { socketClient } from "@/lib/socket/socketClient";
import { useEffect, useState } from "react";

export function useLiveSocket(driverId: string | null) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!driverId) return;

    socketClient.connect(driverId, (data) => {
      setLastMessage(data);

      if (data.type === "connected") {
        setConnected(true);
      }
    });

    return () => {
      socketClient.disconnect();
    };
  }, [driverId]);

  return {
    connected,
    lastMessage,
    sendGPS: socketClient.sendGPS,
    ping: socketClient.ping,
  };
}
