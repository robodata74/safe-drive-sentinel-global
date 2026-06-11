const IORedis = require("ioredis");

// ======================================================
// ENV
// ======================================================
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("REDIS_URL missing");
}

// ======================================================
// CHANNELS
// ======================================================
const CHANNELS = {
  GPS: "gps",
};

// ======================================================
// REDIS OPTIONS
// ======================================================
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,

  retryStrategy(times) {
    return Math.min(times * 200, 3000);
  },

  reconnectOnError() {
    return true;
  },

  keepAlive: 30000,
};

// TLS support for cloud Redis / Upstash
if (REDIS_URL.startsWith("rediss://")) {
  redisOptions.tls = {};
}

// ======================================================
// CLIENTS
// ======================================================
const publisher = new IORedis(REDIS_URL, redisOptions);

const subscriber = new IORedis(REDIS_URL, redisOptions);

// ======================================================
// CLIENT EVENTS
// ======================================================
function bindRedisEvents(client, name) {
  client.on("connect", () => {
    console.log(`🟢 Redis ${name} connected`);
  });

  client.on("ready", () => {
    console.log(`🟢 Redis ${name} ready`);
  });

  client.on("error", (err) => {
    console.warn(`⚠️ Redis ${name}:`, err?.message);
  });

  client.on("reconnecting", () => {
    console.warn(`⚠️ Redis ${name} reconnecting`);
  });
}

bindRedisEvents(publisher, "publisher");

bindRedisEvents(subscriber, "subscriber");

// ======================================================
// PUBLISH
// ======================================================
async function publish(channel, payload) {
  try {
    await publisher.publish(channel, JSON.stringify(payload));
  } catch (err) {
    console.error("Redis publish error:", err?.message);
  }
}

// ======================================================
// SUBSCRIBE
// ======================================================
async function subscribe(channel, callback) {
  try {
    await subscriber.subscribe(channel);

    subscriber.on("message", (incomingChannel, message) => {
      if (incomingChannel !== channel) {
        return;
      }

      try {
        callback(JSON.parse(message));
      } catch (err) {
        console.error("Redis parse error:", err?.message);
      }
    });
  } catch (err) {
    console.error("Redis subscribe failed:", err?.message);

    throw err;
  }
}

module.exports = {
  publish,
  subscribe,
  CHANNELS,
};
