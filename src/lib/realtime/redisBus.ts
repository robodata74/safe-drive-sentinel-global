import Redis from "ioredis";

/**
 * ==========================================================
 * GLOBAL EVENT BUS (REDIS PUB/SUB)
 * ==========================================================
 */

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const CHANNEL = "safedrive-dispatch-events";

export type DispatchEvent =
  | { type: "driver_update"; payload: any }
  | { type: "booking_update"; payload: any }
  | { type: "driver_disconnect"; payload: any };

export function publish(event: DispatchEvent) {
  redis.publish(CHANNEL, JSON.stringify(event));
}

export function subscribe(handler: (event: DispatchEvent) => void) {
  const sub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

  sub.subscribe(CHANNEL);

  sub.on("message", (_, msg) => {
    try {
      handler(JSON.parse(msg));
    } catch {}
  });

  return () => sub.disconnect();
}
