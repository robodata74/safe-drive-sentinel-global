const Redis = require("ioredis");

if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL missing");
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,

  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000);

    console.log(`🔄 Redis reconnect attempt ${times}`);
    return delay;
  },

  reconnectOnError(err) {
    console.log("🔴 Redis reconnect:", err.message);
    return true;
  },

  tls: {},
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("ready", () => {
  console.log("🚀 Redis ready");
});

redis.on("error", (err) => {
  console.log("🔴 Redis error:", err.message);
});

redis.on("close", () => {
  console.log("⚠️ Redis connection closed");
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

/**
 * Store value
 */
async function setValue(key, value, ttl = 60) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("Redis setValue failed:", err.message);
  }
}

/**
 * Get value
 */
async function getValue(key) {
  try {
    const data = await redis.get(key);

    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis getValue failed:", err.message);
    return null;
  }
}

module.exports = {
  redis,
  setValue,
  getValue,
};
