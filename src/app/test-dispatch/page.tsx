"use client";

import type { Booking, Driver } from "@/lib/dispatch/dispatchEngine";
import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import { useEffect } from "react";

export default function TestDispatchPage() {
  useEffect(() => {
    /**
     * =========================
     * VALID DRIVER DATA (STRICT TYPE SAFE)
     * =========================
     */
    const driver: Driver = {
      id: "driver-1",
      name: "John Doe",
      status: "available" as const,
      location: {
        lat: -1.2921,
        lng: 36.8219,
      },
      lastSeen: Date.now(),
    };

    /**
     * =========================
     * VALID BOOKING DATA (STRICT TYPE SAFE)
     * =========================
     */
    const booking: Booking = {
      id: "booking-1",
      status: "pending" as const,
      pickup: {
        lat: -1.3,
        lng: 36.82,
      },
      createdAt: Date.now(),
    };

    /**
     * =========================
     * INJECT INTO DISPATCH ENGINE
     * =========================
     */
    dispatchStore.addOrUpdateDriver(driver);
    dispatchStore.createBooking(booking);

    /**
     * =========================
     * LIVE TEST OUTPUT
     * =========================
     */
    const snapshot = dispatchStore.getSnapshot();
    console.log("🚚 DISPATCH SNAPSHOT:", snapshot);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Dispatch Test Running</h1>
      <p>Check console for live dispatch engine output.</p>
    </div>
  );
}
