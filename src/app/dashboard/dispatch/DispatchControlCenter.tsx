"use client";

import LiveMap from "@/components/maps/LiveMap";
import { Activity, AlertCircle, MapPin, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLiveSocket } from "@/hooks/useLiveSocket";
import { Booking, DispatchEngine, Driver, createLiveLocation } from "./engine";

/**
 * Smooth interpolation helper
 */
function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

type LiveEvent = {
  type: string;
  driverId?: string;
  lat?: number;
  lng?: number;
};

export default function DispatchControlCenter() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  const driverId = "admin-dispatcher";

  const { connected, lastMessage } = useLiveSocket(driverId);

  /**
   * Target positions from socket (no rerender spam)
   */
  const targetsRef = useRef<Record<string, { lat: number; lng: number }>>({});

  /**
   * Animation frame controller
   */
  const rafRef = useRef<number | null>(null);

  /**
   * INIT MOCK DATA (replace with Supabase later)
   */
  useEffect(() => {
    setDrivers([
      {
        id: "drv_1",
        name: "Driver Alpha",
        status: "available",
        lat: -1.2921,
        lng: 36.8219,
      },
      {
        id: "drv_2",
        name: "Driver Beta",
        status: "busy",
        lat: -1.3,
        lng: 36.8,
      },
    ]);

    setBookings([
      {
        id: "bk_1",
        status: "pending",
        pickup_address: "Nairobi CBD",
        dropoff_address: "Westlands",
        fare_amount: 1200,
        created_at: new Date().toISOString(),
        customer_name: "John Doe",
        lat: -1.2921,
        lng: 36.8219,
      },
      {
        id: "bk_2",
        status: "pending",
        pickup_address: "Kilimani",
        dropoff_address: "Airport",
        fare_amount: 2500,
        created_at: new Date().toISOString(),
        customer_name: "Mary W",
        lat: -1.31,
        lng: 36.81,
      },
    ]);

    setLoading(false);
  }, []);

  /**
   * SOCKET STREAM HANDLER (safe + minimal updates)
   */
  useEffect(() => {
    if (!lastMessage) return;

    setLiveEvents((prev) => [lastMessage, ...prev].slice(0, 50));

    if (lastMessage.type !== "gps_update") return;

    const { driverId, lat, lng } = lastMessage;

    if (!driverId || typeof lat !== "number" || typeof lng !== "number") return;

    // store ONLY target position (no re-render storm)
    targetsRef.current[driverId] = { lat, lng };
  }, [lastMessage]);

  /**
   * SMOOTH ANIMATION LOOP (stable + no memory leaks)
   */
  useEffect(() => {
    const animate = () => {
      setDrivers((prev) =>
        prev.map((d) => {
          const target = targetsRef.current[d.id];
          if (!target) return d;

          return {
            ...d,
            lat: lerp(d.lat, target.lat, 0.12),
            lng: lerp(d.lng, target.lng, 0.12),
          };
        }),
      );

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /**
   * AI MATCHING ENGINE
   */
  const matches = useMemo(() => {
    if (!bookings.length || !drivers.length) return [];
    return DispatchEngine.autoMatch(bookings, drivers);
  }, [bookings, drivers]);

  /**
   * MAP DATA
   */
  const truckLocations = useMemo(() => {
    return drivers.map(createLiveLocation);
  }, [drivers]);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h1 className="text-lg font-semibold">
            Dispatch AI Control Center v2
          </h1>
          <p className="text-xs text-slate-400">
            Smooth GPS streaming + live fleet tracking
          </p>
        </div>

        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1 text-green-400">
            <Activity className="w-4 h-4" />
            Engine Live
          </span>

          <span className={connected ? "text-green-400" : "text-red-400"}>
            {connected ? "Socket Connected" : "Offline"}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* BOOKINGS */}
        <div className="w-[320px] border-r border-white/10 p-3 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <MapPin className="w-4 h-4" />
            Bookings
          </div>

          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"
              >
                <div className="text-sm">{b.customer_name}</div>
                <div className="text-xs text-slate-400">
                  {b.pickup_address} → {b.dropoff_address}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAP */}
        <div className="flex-1 relative">
          <LiveMap truckLocations={truckLocations} interactive={false} />

          {/* DEBUG PANEL */}
          <div className="absolute bottom-2 left-2 w-72 max-h-48 overflow-auto bg-black/70 text-xs p-2 rounded">
            <div className="text-green-400 mb-1">
              Live Events ({liveEvents.length})
            </div>

            {liveEvents.map((e, i) => (
              <pre key={i} className="text-[10px]">
                {JSON.stringify(e, null, 2)}
              </pre>
            ))}
          </div>
        </div>

        {/* DRIVERS */}
        <div className="w-[320px] border-l border-white/10 p-3 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Truck className="w-4 h-4" />
            Fleet
          </div>

          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.id} className="p-3 rounded-lg border border-white/10">
                <div className="text-sm">{d.name}</div>
                <div className="text-xs text-slate-400">
                  {d.lat.toFixed(5)}, {d.lng.toFixed(5)}
                </div>
              </div>
            ))}
          </div>

          {/* STATUS */}
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              System Status
            </div>

            <p className="text-xs text-slate-400 mt-1">
              {matches.length > 0
                ? `${matches.length} active matches`
                : "Stable"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
