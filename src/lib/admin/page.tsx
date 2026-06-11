"use client";

import { adminEngine } from "@/lib/admin/adminEngine";
import { useEffect, useState } from "react";

/**
 * =========================================================
 * SAFE DRIVE ADMIN DASHBOARD
 * =========================================================
 */

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot = adminEngine.getSystemSnapshot();
      setData(snapshot);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!data) return <div>Loading Admin Dashboard...</div>;

  return (
    <div
      style={{
        padding: 20,
        color: "white",
        background: "#0b1220",
        minHeight: "100vh",
      }}
    >
      <h1>🧭 SafeDrive Admin Control Center</h1>

      {/* SYSTEM METRICS */}
      <section>
        <h2>📊 System Metrics</h2>
        <p>Total Drivers: {data.metrics.totalDrivers}</p>
        <p>Active Drivers: {data.metrics.activeDrivers}</p>
        <p>Pending Bookings: {data.metrics.pendingBookings}</p>
        <p>Completed Bookings: {data.metrics.completedBookings}</p>
      </section>

      {/* LIVE DRIVERS */}
      <section>
        <h2>🚗 Live Drivers</h2>
        {data.drivers.map((d: any) => (
          <div key={d.id}>
            {d.name || d.id} — {d.status}
          </div>
        ))}
      </section>

      {/* BOOKINGS */}
      <section>
        <h2>📦 Bookings</h2>
        {data.bookings.map((b: any) => (
          <div key={b.id}>
            {b.id} — {b.status}
          </div>
        ))}
      </section>
    </div>
  );
}
