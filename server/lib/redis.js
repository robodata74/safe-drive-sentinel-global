const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️ REDIS_URL missing — Redis disabled");

  module.exports = {
    redis: null,
    setValue: async () => null,
    getValue: async () => null,
    deleteValue: async () => null,
  };

  return;
}

/**
 * PRODUCTION HARDENED REDIS
 * Render + Upstash Safe
 */
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
    const delay = Math.min(times * 500, 5000);

    console.log(`🔄 Redis reconnect attempt ${times}`);

    return delay;
  },

  reconnectOnError(err) {
    console.log("🟠 Redis reconnecting:", err.message);

    return true;
  },
});

/**
 * SAFE CONNECT
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
 * EVENTS
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

redis.on("close", () => {
  console.log("⚫ Redis closed");
});

redis.on("reconnecting", () => {
  console.log("🟠 Redis reconnecting...");
});

/**
 * SAFE SET
 */
async function setValue(key, value, ttl = 60) {
  try {
    if (!redis.status || redis.status !== "ready") {
      return false;
    }

    await redis.set(key, JSON.stringify(value), "EX", ttl);

    return true;
  } catch (err) {
    console.error("❌ Redis SET failed:", err.message);

    return false;
  }
}

/**
 * SAFE GET
 */
async function getValue(key) {
  try {
    if (!redis.status || redis.status !== "ready") {
      return null;
    }

    const data = await redis.get(key);

    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("❌ Redis GET failed:", err.message);

    return null;
  }
}

/**
 * SAFE DELETE
 */
async function deleteValue(key) {
  try {
    if (!redis.status || redis.status !== "ready") {
      return false;
    }

    await redis.del(key);

    return true;
  } catch (err) {
    console.error("❌ Redis DELETE failed:", err.message);

    return false;
  }
}

/**
 * PREVENT NODE CRASHES
 */
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

module.exports = {
  redis,
  setValue,
  getValue,
  deleteValue,
};
