const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

const pub = redisUrl
  ? new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: null,
      tls: { rejectUnauthorized: false },
    })
  : null;

const sub = redisUrl
  ? new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: null,
      tls: { rejectUnauthorized: false },
    })
  : null;

const CHANNELS = {
  GPS: "gps-stream",
};

/**
 * Publish event (safe)
 */
function publish(channel, data) {
  if (!pub) return;

  try {
    pub.publish(channel, JSON.stringify(data));
  } catch (err) {
    console.error("🔴 Publish failed:", err.message);
  }
}

/**
 * Subscribe handler
 */
function subscribe(channel, handler) {
  if (!sub) return;

  sub.subscribe(channel);

  sub.on("message", (ch, message) => {
    if (ch !== channel) return;

    try {
      handler(JSON.parse(message));
    } catch (err) {
      console.error("🔴 Subscribe parse error:", err.message);
    }
  });
}

module.exports = {
  publish,
  subscribe,
  CHANNELS,
};
