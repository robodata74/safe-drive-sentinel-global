"use client";

import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import { useEffect, useMemo, useState } from "react";

/**
 * ==========================================================
 * SAFE DRIVE GLOBAL — DISPATCH COCKPIT (UX v4.4 POLISHED)
 * PRODUCTION-GRADE LIVE OPERATIONS CONTROL CENTER
 * ==========================================================
 */

type Props = {
  map: React.ReactNode;
  children?: React.ReactNode;
};

export default function DispatchCockpit({ map, children }: Props) {
  const [snapshot, setSnapshot] = useState(() => dispatchStore.getSnapshot());

  /**
   * ======================================================
   * SAFE SUBSCRIPTION LAYER (NO MEMORY LEAKS)
   * ======================================================
   */
  useEffect(() => {
    const unsub = dispatchStore.subscribe(() => {
      const next = dispatchStore.getSnapshot();
      setSnapshot(next);
    });

    return () => unsub();
  }, []);

  /**
   * ======================================================
   * DEFENSIVE NORMALIZATION (CRITICAL FOR PRODUCTION)
   * ======================================================
   */
  const drivers = snapshot?.drivers ?? [];
  const bookings = snapshot?.bookings ?? [];

  /**
   * ======================================================
   * DERIVED UI STATE (PURE + STABLE)
   * ======================================================
   */
  const ui = useMemo(() => {
    const active = drivers.filter((d) => d.status === "busy");
    const available = drivers.filter((d) => d.status === "available");
    const offline = drivers.filter((d) => d.status === "offline");

    const pending = bookings.filter((b) => b.status === "pending");
    const assigned = bookings.filter((b) => b.status === "assigned");
    const completed = bookings.filter((b) => b.status === "completed");

    return {
      drivers: {
        total: drivers.length,
        active,
        available,
        offline,
      },
      bookings: {
        pending,
        assigned,
        completed,
      },
    };
  }, [drivers, bookings]);

  return (
    <div className="h-screen w-full flex flex-col bg-navy-950 text-white overflow-hidden">
      {/* ======================================================
          TOP OPS BAR (STABLE HEADER)
      ====================================================== */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] bg-black/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium tracking-wide">
            SafeDrive Global • Live Dispatch Control
          </span>
        </div>

        <div className="flex gap-6 text-xs text-slate-300">
          <span>Total: {ui.drivers.total}</span>
          <span>Active: {ui.drivers.active.length}</span>
          <span>Pending: {ui.bookings.pending.length}</span>
          <span>Assigned: {ui.bookings.assigned.length}</span>
        </div>
      </div>

      {/* ======================================================
          MAIN OPS GRID
      ====================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ================= LEFT PANEL ================= */}
        <div className="w-[340px] border-r border-white/[0.06] p-3 space-y-4 overflow-y-auto">
          <h3 className="text-xs text-slate-400 uppercase tracking-wider">
            Drivers Status
          </h3>

          {/* AVAILABLE */}
          <section className="space-y-2">
            <div className="text-[10px] text-green-400">AVAILABLE</div>

            {ui.drivers.available.length === 0 ? (
              <div className="text-xs text-slate-500">No available drivers</div>
            ) : (
              ui.drivers.available.map((d) => (
                <div
                  key={d.id}
                  className="glass-card p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {d.name ?? d.id.slice(0, 6)}
                    </div>
                    <div className="text-xs text-slate-400">Ready</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              ))
            )}
          </section>

          {/* ACTIVE */}
          <section className="space-y-2 pt-2">
            <div className="text-[10px] text-yellow-400">ACTIVE JOBS</div>

            {ui.drivers.active.length === 0 ? (
              <div className="text-xs text-slate-500">No active jobs</div>
            ) : (
              ui.drivers.active.map((d) => (
                <div
                  key={d.id}
                  className="glass-card p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {d.name ?? d.id.slice(0, 6)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Booking: {d.active_booking_id?.slice(0, 6) ?? "—"}
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                </div>
              ))
            )}
          </section>

          {/* OFFLINE */}
          <section className="space-y-2 pt-2">
            <div className="text-[10px] text-red-400">OFFLINE</div>

            {ui.drivers.offline.length === 0 ? (
              <div className="text-xs text-slate-500">No offline drivers</div>
            ) : (
              ui.drivers.offline.map((d) => (
                <div
                  key={d.id}
                  className="glass-card p-3 flex justify-between items-center opacity-60"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {d.name ?? d.id.slice(0, 6)}
                    </div>
                    <div className="text-xs text-slate-400">Offline</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                </div>
              ))
            )}
          </section>
        </div>

        {/* ================= CENTER MAP (ISOLATED RENDER ZONE) ================= */}
        <div className="flex-1 relative bg-black">
          <div className="absolute inset-0">{map}</div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="w-[340px] border-l border-white/[0.06] p-3 space-y-4 overflow-y-auto">
          <h3 className="text-xs text-slate-400 uppercase tracking-wider">
            Booking Queue
          </h3>

          {/* PENDING */}
          <section className="space-y-2">
            <div className="text-[10px] text-blue-400">PENDING</div>

            {ui.bookings.pending.length === 0 ? (
              <div className="text-xs text-slate-500">No pending bookings</div>
            ) : (
              ui.bookings.pending.map((b) => (
                <div key={b.id} className="glass-card p-3">
                  <div className="text-sm font-medium">#{b.id.slice(0, 6)}</div>
                  <div className="text-xs text-slate-400">
                    Waiting for driver
                  </div>
                </div>
              ))
            )}
          </section>

          {/* ASSIGNED */}
          <section className="space-y-2 pt-2">
            <div className="text-[10px] text-yellow-400">ASSIGNED</div>

            {ui.bookings.assigned.length === 0 ? (
              <div className="text-xs text-slate-500">No assigned bookings</div>
            ) : (
              ui.bookings.assigned.map((b) => (
                <div key={b.id} className="glass-card p-3">
                  <div className="text-sm font-medium">#{b.id.slice(0, 6)}</div>
                  <div className="text-xs text-slate-400">
                    Driver: {b.assigned_driver_id?.slice(0, 6) ?? "—"}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* COMPLETED */}
          <section className="space-y-2 pt-2">
            <div className="text-[10px] text-green-400">COMPLETED</div>

            {ui.bookings.completed.length === 0 ? (
              <div className="text-xs text-slate-500">No completed jobs</div>
            ) : (
              ui.bookings.completed.slice(0, 5).map((b) => (
                <div key={b.id} className="glass-card p-3 opacity-60">
                  <div className="text-sm font-medium">#{b.id.slice(0, 6)}</div>
                  <div className="text-xs text-slate-400">Done</div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>

      {/* OPTIONAL SLOT */}
      {children}
    </div>
  );
}
