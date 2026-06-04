"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BookingForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pickup_address, setPickup] = useState("");
  const [dropoff_address, setDropoff] = useState("");
  const [vehicle_description, setVehicle] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_address,
          dropoff_address,
          vehicle_description,
          notes,
        }),
      });

      // 🚨 IMPORTANT: guard against HTML error pages
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Booking failed");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        throw new Error("Server did not return JSON: " + text.slice(0, 80));
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Booking failed");
      }

      router.push(`/dashboard/bookings/${data.booking.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={pickup_address}
        onChange={(e) => setPickup(e.target.value)}
        placeholder="Pickup location"
        className="input-base w-full"
        required
      />

      <input
        value={dropoff_address}
        onChange={(e) => setDropoff(e.target.value)}
        placeholder="Dropoff location"
        className="input-base w-full"
        required
      />

      <input
        value={vehicle_description}
        onChange={(e) => setVehicle(e.target.value)}
        placeholder="Vehicle description"
        className="input-base w-full"
        required
      />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="input-base w-full"
      />

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      <button disabled={loading} className="btn-primary w-full">
        {loading ? "Creating..." : "Create Booking"}
      </button>
    </form>
  );
}
