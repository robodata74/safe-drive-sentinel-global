const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

let redis = null;

/**
 * ======================================================
 * SAFE REDIS INITIALIZATION
 * ======================================================
 */
if (!redisUrl) {
  console.warn("⚠️ REDIS_URL missing - running without Redis");
} else {
  try {
    redis = new Redis(redisUrl, {
      lazyConnect: true,

      // Never queue requests when offline
      enableOfflineQueue: false,

      // Prevent crash loop
      maxRetriesPerRequest: 1,

      // Faster failure recovery
      connectTimeout: 10000,

      // Upstash TLS support
      tls: {},

      /**
       * Retry Strategy
       * Prevent infinite reconnect storms
       */
      retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);

        console.log(`🟠 Redis reconnect attempt ${times} in ${delay}ms`);

        return delay;
      },

      /**
       * Reconnect on connection reset
       */
      reconnectOnError(err) {
        const targetErrors = ["ECONNRESET", "ETIMEDOUT", "EPIPE"];

        const shouldReconnect = targetErrors.some((e) =>
          err.message.includes(e),
        );

        if (shouldReconnect) {
          console.log("🔄 Redis reconnecting after error");
          return true;
        }

        return false;
      },
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
     * ======================================================
     * REDIS EVENTS
     * ======================================================
     */
    redis.on("connect", () => {
      console.log("🟢 Redis socket opened");
    });

    redis.on("ready", () => {
      console.log("✅ Redis ready");
    });

    redis.on("error", (err) => {
      console.error("⚠️ Redis error:", err.message);
    });

    redis.on("reconnecting", () => {
      console.log("🟠 Redis reconnecting...");
    });

    redis.on("close", () => {
      console.log("⚫ Redis connection closed");
    });

    redis.on("end", () => {
      console.log("🔴 Redis disconnected");
    });
  } catch (err) {
    console.error("🔴 Failed to initialize Redis:", err.message);
  }
}

/**
 * ======================================================
 * SET VALUE
 * ======================================================
 */
async function setValue(key, value, ttl = 60) {
  if (!redis) return false;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);

    return true;
  } catch (err) {
    console.error("Redis SET failed:", err.message);

    return false;
  }
}

/**
 * ======================================================
 * GET VALUE
 * ======================================================
 */
async function getValue(key) {
  if (!redis) return null;

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
 * ======================================================
 * DELETE VALUE
 * ======================================================
 */
async function deleteValue(key) {
  if (!redis) return false;

  try {
    await redis.del(key);

    return true;
  } catch (err) {
    console.error("Redis DELETE failed:", err.message);

    return false;
  }
}

/**
 * ======================================================
 * HEALTH CHECK
 * ======================================================
 */
async function pingRedis() {
  if (!redis) return false;

  try {
    const pong = await redis.ping();

    return pong === "PONG";
  } catch {
    return false;
  }
}

module.exports = {
  redis,
  setValue,
  getValue,
  deleteValue,
  pingRedis,
};
