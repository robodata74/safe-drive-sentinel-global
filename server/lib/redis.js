const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️ REDIS_URL missing — Redis disabled");
  module.exports = null;
  return;
}

const redisOptions = {
  lazyConnect: true,
  enableOfflineQueue: false,

  // Prevent Render retry crash
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
};

const redis = new Redis(redisUrl, redisOptions);

// Safe logging
redis.on("connect", () => {
  console.log("🟢 Redis connecting...");
});

redis.on("ready", () => {
  console.log("✅ Redis ready");
});

redis.on("error", (err) => {
  console.error("🔴 Redis error:", err.message);
});

redis.on("close", () => {
  console.log("⚫ Redis closed");
});

module.exports = redis;
