const MAX_BUFFER_SIZE = 50;

// driverId -> events[]
const buffer = new Map();

/**
 * Store event for replay/fallback
 */
function pushEvent(driverId, event) {
  if (!driverId) return;

  if (!buffer.has(driverId)) {
    buffer.set(driverId, []);
  }

  const list = buffer.get(driverId);

  list.push(event);

  if (list.length > MAX_BUFFER_SIZE) {
    list.shift();
  }
}

/**
 * Get recent events for reconnect recovery
 */
function getEvents(driverId) {
  return buffer.get(driverId) || [];
}

/**
 * Clear driver buffer (optional)
 */
function clearEvents(driverId) {
  buffer.delete(driverId);
}

module.exports = {
  pushEvent,
  getEvents,
  clearEvents,
};
