import type { Booking, Driver } from "./dispatchEngine";
import { dispatchStore } from "./dispatchStore";

/**
 * =========================
 * TEST DRIVER (TYPE SAFE)
 * =========================
 */

const driver: Driver = {
  id: "driver_1",
  name: "Test Driver",
  status: "available", // ✅ must match DriverStatus union
  location: {
    lat: -1.2921,
    lng: 36.8219,
  },
  lastSeen: Date.now(),
};

/**
 * =========================
 * TEST BOOKING (TYPE SAFE)
 * =========================
 */

const booking: Booking = {
  id: "booking_1",
  status: "pending", // ✅ must match Booking status union
  pickup: {
    lat: -1.3,
    lng: 36.82,
  },
  createdAt: Date.now(),
};

/**
 * =========================
 * EXECUTE TEST
 * =========================
 */

dispatchStore.addOrUpdateDriver(driver);
dispatchStore.createBooking(booking);

console.log("📦 DISPATCH SNAPSHOT:", dispatchStore.getSnapshot());
