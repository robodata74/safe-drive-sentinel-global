class DispatchSocketManager {
  constructor() {
    this.drivers = new Map();
    this.locations = new Map();
  }

  connectDriver(driverId, callback) {
    this.drivers.set(driverId, callback);
  }

  disconnectDriver(driverId) {
    this.drivers.delete(driverId);
    this.locations.delete(driverId);
  }

  handleLocationUpdate({ driverId, lat, lng, speed, heading }) {
    if (!driverId) return;

    const location = {
      driverId,
      lat,
      lng,
      speed: speed || 0,
      heading: heading || 0,
      updatedAt: Date.now(),
    };

    this.locations.set(driverId, location);

    const payload = {
      type: "driver_location_update",
      payload: location,
    };

    const cb = this.drivers.get(driverId);
    if (cb) cb(payload);
  }

  getDriverLocation(driverId) {
    return this.locations.get(driverId) || null;
  }

  getAllLocations() {
    return Array.from(this.locations.values());
  }
}

const dispatchSocketManager = new DispatchSocketManager();

/**
 * 🔥 IMPORTANT: EXPORT DIRECTLY (NO WRAPPER OBJECT)
 */
module.exports = dispatchSocketManager;
