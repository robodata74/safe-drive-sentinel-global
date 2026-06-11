const Redis = require("ioredis");

/**
 * ======================================================
 * ENV VALIDATION (FAIL FAST)
 * ======================================================
 */
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("❌ REDIS_URL missing - system cannot start");
}

/**
 * ======================================================
 * SINGLE REDIS INSTANCE (CRITICAL FIX)
 * ======================================================
 */
const redis = new Redis(redisUrl, {
  lazyConnect: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,

  retryStrategy(times) {
    return Math.min(times * 200, 3000);
  },

  reconnectOnError() {
    return true;
  },

  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
});

/**
 * ======================================================
 * SAFE EVENT LOGGING
 * ======================================================
 */
redis.on("connect", () => console.log("🟢 Redis connected"));
redis.on("ready", () => console.log("✅ Redis ready"));
redis.on("error", (err) => console.error("🔴 Redis error:", err.message));
redis.on("close", () => console.warn("⚠️ Redis connection closed"));

/**
 * ======================================================
 * SAFE KV OPERATIONS
 * ======================================================
 */
async function setValue(key, value, ttl = 60) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("Redis SET failed:", err.message);
  }
}

async function getValue(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis GET failed:", err.message);
    return null;
  }
}

async function deleteValue(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Redis DEL failed:", err.message);
  }
}

module.exports = {
  redis,
  setValue,
  getValue,
  deleteValue,
};
