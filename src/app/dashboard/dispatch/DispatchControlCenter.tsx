"use client";

import LiveMap from "@/components/maps/LiveMap";
import { formatCurrency } from "@/lib/utils";
import { Activity, AlertCircle, MapPin, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Booking, DispatchEngine, Driver, createLiveLocation } from "./engine";

export default function DispatchControlCenter() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [loading, setLoading] = useState(true);

  // MOCK DATA (replace with Supabase later)
  useEffect(() => {
    const load = async () => {
      setLoading(true);

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

      setLoading(false);
    };

    load();
  }, []);

  // AI MATCHING ENGINE
  const matches = useMemo(() => {
    if (!bookings.length || !drivers.length) return [];
    return DispatchEngine.autoMatch(bookings, drivers);
  }, [bookings, drivers]);

  // FIXED LIVE MAP DATA (your TS error fixed here)
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
            AI-powered fleet matching system
          </p>
        </div>

        <div className="flex gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1">
            <Activity className="w-4 h-4 text-green-400" />
            Engine Live
          </span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex flex-1 overflow-hidden">
        {/* BOOKINGS */}
        <div className="w-[320px] border-r border-white/10 p-3 overflow-y-auto">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Bookings
          </h2>

          {loading ? (
            <p className="text-xs text-slate-400">Loading...</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`p-3 rounded-lg cursor-pointer border transition ${
                    selectedBooking?.id === b.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="text-sm font-medium">{b.customer_name}</div>

                  <div className="text-xs text-slate-400">
                    {b.pickup_address} → {b.dropoff_address}
                  </div>

                  <div className="flex justify-between text-xs mt-1">
                    <span>{b.status}</span>
                    <span className="text-green-400">
                      {b.fare_amount ? formatCurrency(b.fare_amount) : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAP */}
        <div className="flex-1">
          <LiveMap truckLocations={truckLocations} interactive={false} />
        </div>

        {/* DRIVERS */}
        <div className="w-[320px] border-l border-white/10 p-3 overflow-y-auto">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Fleet Status
          </h2>

          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.id} className="p-3 rounded-lg border border-white/10">
                <div className="flex justify-between">
                  <span className="text-sm">{d.name}</span>

                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                    {d.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                </div>
              </div>
            ))}
          </div>

          {/* ALERTS */}
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              System Status
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {matches.length > 0
                ? `${matches.length} AI matches generated`
                : "No active alerts"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
