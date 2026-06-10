const Redis = require("ioredis");

const pub = new Redis(process.env.REDIS_URL);
const sub = new Redis(process.env.REDIS_URL);

const CHANNELS = {
  GPS: "gps_channel",
  DRIVER: "driver_channel",
};

/**
 * PUBLISH EVENT
 */
function publish(channel, message) {
  pub.publish(channel, JSON.stringify(message));
}

/**
 * SUBSCRIBE HANDLER
 */
function subscribe(channel, handler) {
  sub.subscribe(channel);

  sub.on("message", (ch, message) => {
    if (ch !== channel) return;

    try {
      handler(JSON.parse(message));
    } catch {}
  });
}

module.exports = {
  publish,
  subscribe,
  CHANNELS,
};
