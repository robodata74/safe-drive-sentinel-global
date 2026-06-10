"use client";

import type { Booking, Driver } from "@/lib/dispatch/dispatchEngine";
import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import { useEffect } from "react";

export default function TestSystemPage() {
  useEffect(() => {
    console.log("🚀 SYSTEM TEST STARTING...");

    /**
     * =========================
     * DRIVER (STRICT TYPE SAFE)
     * =========================
     */
    const driver: Driver = {
      id: "driver-1",
      name: "Test Driver",
      status: "available",
      location: {
        lat: -1.2921,
        lng: 36.8219,
      },
      lastSeen: Date.now(),
    };

    /**
     * =========================
     * BOOKING (STRICT TYPE SAFE)
     * =========================
     */
    const booking: Booking = {
      id: "booking-1",
      status: "pending",
      pickup: {
        lat: -1.3,
        lng: 36.82,
      },
      createdAt: Date.now(),
    };

    /**
     * =========================
     * ENGINE EXECUTION
     * =========================
     */
    dispatchStore.addOrUpdateDriver(driver);
    dispatchStore.createBooking(booking);

    /**
     * delayed snapshot to confirm async pipeline stability
     */
    setTimeout(() => {
      console.log("📦 SNAPSHOT:", dispatchStore.getSnapshot());
      console.log("📊 LOGS:", dispatchStore.getLogs());
    }, 1500);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🧪 Full Dispatch System Test</h1>
      <p>Check browser console for full pipeline output</p>
    </div>
  );
}
