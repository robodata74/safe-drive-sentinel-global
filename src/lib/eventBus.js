const { publish, CHANNELS } = require("./redisPubSub");
const { pushEvent } = require("./realtimeBuffer");

/**
 * CENTRAL EVENT DISPATCHER
 * NEVER allowed to crash system
 */
function emitGPS(driverId, payload) {
  try {
    // 1. Always store locally first (guaranteed)
    pushEvent(driverId, payload);

    // 2. Best-effort cross-server sync
    publish(CHANNELS.GPS, payload);
  } catch (err) {
    console.error("🔴 EventBus error:", err.message);
  }
}

module.exports = {
  emitGPS,
};
