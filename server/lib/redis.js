const Redis = require("ioredis");

if (!process.env.REDIS_URL) {
  throw new Error("❌ REDIS_URL missing");
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log("🟢 Redis connected");
});

redis.on("error", (err) => {
  console.error("🔴 Redis error:", err.message);
});

/**
 * Store value
 */
async function setValue(key, value, ttl = 60) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("Redis set error:", err.message);
  }
}

/**
 * Get value
 */
async function getValue(key) {
  try {
    const value = await redis.get(key);

    if (!value) return null;

    return JSON.parse(value);
  } catch (err) {
    console.error("Redis get error:", err.message);
    return null;
  }
}

module.exports = {
  redis,
  setValue,
  getValue,
};
