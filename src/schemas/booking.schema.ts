import { z } from "zod";

export const CreateBookingSchema = z.object({
  service_type: z.enum([
    "flatbed_tow",
    "battery_jumpstart",
    "fuel_delivery",
    "tire_change",
    "lockout",
    "emergency_rescue",
    "luxury_transport",
    "cross_border",
    "ev_recovery",
    "car_relocation",
  ]),

  pickup_lat: z.number(),
  pickup_lng: z.number(),
  pickup_address: z.string(),

  dropoff_lat: z.number(),
  dropoff_lng: z.number(),
  dropoff_address: z.string(),

  vehicle_description: z.string(),
  special_notes: z.string().optional(),

  distance_km: z.number().optional(),
});

export const CancelBookingSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().min(3),
});

export const QuoteSchema = z.object({
  service_type: z.string(),
  distance_km: z.number(),
});
