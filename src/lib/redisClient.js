const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️ REDIS_URL missing — Redis disabled");
  module.exports = null;
  return;
}

const redis = new Redis(redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,

  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000,

  tls: {
    rejectUnauthorized: false,
  },

  retryStrategy(times) {
    return Math.min(times * 500, 5000);
  },

  reconnectOnError() {
    return true;
  },
});

// SAFE EVENTS (never crash server)
redis.on("connect", () => console.log("🟢 Redis connecting..."));
redis.on("ready", () => console.log("✅ Redis ready"));
redis.on("close", () => console.log("⚫ Redis closed"));
redis.on("error", (err) => console.error("🔴 Redis error:", err.message));

module.exports = redis;
