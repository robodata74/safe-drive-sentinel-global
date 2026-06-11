const Redis = require("ioredis");
const { REDIS_URL } = require("./config");

let redis = null;

function createRedis() {
  if (redis) return redis;

  redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    retryStrategy(times) {
      return Math.min(times * 200, 3000);
    },
  });

  redis.on("connect", () => console.log("🟢 Redis connecting..."));
  redis.on("ready", () => console.log("✅ Redis ready"));
  redis.on("error", (err) => console.error("🔴 Redis error:", err.message));
  redis.on("close", () => console.log("⚫ Redis closed"));

  return redis;
}

module.exports = createRedis();
