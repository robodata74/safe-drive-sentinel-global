"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * =========================
 * SAFE GEOCODER (OSM)
 * =========================
 */
async function geocode(address: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address,
    )}`,
  );

  if (!res.ok) throw new Error("Geocoding failed");

  const data = await res.json();

  if (!data?.length) throw new Error("Location not found: " + address);

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name,
  };
}

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
      /**
       * =========================
       * STEP 1: GEOCODE LOCATIONS
       * =========================
       */
      const pickupGeo = await geocode(pickup_address);
      const dropoffGeo = await geocode(dropoff_address);

      /**
       * =========================
       * STEP 2: SEND STRUCTURED DATA
       * =========================
       */
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup: {
            lat: pickupGeo.lat,
            lng: pickupGeo.lng,
            address: pickupGeo.display_name,
          },
          dropoff: {
            lat: dropoffGeo.lat,
            lng: dropoffGeo.lng,
            address: dropoffGeo.display_name,
          },
          vehicle_description,
          notes,
        }),
      });

      /**
       * =========================
       * SAFE RESPONSE HANDLING
       * =========================
       */
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Booking failed");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        throw new Error("Invalid server response: " + text.slice(0, 80));
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
