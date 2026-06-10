const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

async function setValue(key, value, ttlSeconds = 60) {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

async function getValue(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

module.exports = {
  redis,
  setValue,
  getValue,
};
