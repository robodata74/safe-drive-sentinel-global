const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("❌ REDIS_URL missing");
}

/**
 * MAIN REDIS CONNECTION
 * Production-safe for Render + Upstash
 */
const redis = new Redis(redisUrl, {
  lazyConnect: true,

  enableOfflineQueue: false,

  maxRetriesPerRequest: null,

  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);

    console.log(`🔄 Redis reconnect attempt ${times}`);

    return delay;
  },

  reconnectOnError() {
    return true;
  },

  tls: {},
});

/**
 * CONNECT SAFELY
 */
(async () => {
  try {
    await redis.connect();

    console.log("✅ Redis connected");
  } catch (err) {
    console.error("🔴 Redis connection failed:", err.message);
  }
})();

/**
 * REDIS EVENTS
 */
redis.on("connect", () => {
  console.log("🟢 Redis socket opened");
});

redis.on("ready", () => {
  console.log("✅ Redis ready");
});

redis.on("error", (err) => {
  console.error("🔴 Redis error:", err.message);
});

redis.on("reconnecting", () => {
  console.log("🟠 Redis reconnecting...");
});

redis.on("close", () => {
  console.log("⚫ Redis closed");
});

/**
 * SET VALUE
 */
async function setValue(key, value, ttl = 60) {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("Redis SET failed:", err.message);
  }
}

/**
 * GET VALUE
 */
async function getValue(key) {
  try {
    const data = await redis.get(key);

    if (!data) return null;

    return JSON.parse(data);
  } catch (err) {
    console.error("Redis GET failed:", err.message);

    return null;
  }
}

/**
 * DELETE VALUE
 */
async function deleteValue(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Redis DELETE failed:", err.message);
  }
}

module.exports = {
  redis,
  setValue,
  getValue,
  deleteValue,
};
