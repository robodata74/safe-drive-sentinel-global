const Redis = require("ioredis");

// SINGLE CONNECTION (Production safe)
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  console.log("🟢 Redis connected");
});

redis.on("error", (err) => {
  console.error("🔴 Redis error:", err.message);
});

/**
 * SET VALUE (with TTL)
 */
async function setValue(key, value, ttlSeconds = 60) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("Redis SET error:", err.message);
  }
}

/**
 * GET VALUE
 */
async function getValue(key) {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.error("Redis GET error:", err.message);
    return null;
  }
}

module.exports = {
  redis,
  setValue,
  getValue,
};
