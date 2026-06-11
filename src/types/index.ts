// src/types/index.ts

/**
 * Booking lifecycle states
 */
export type BookingStatus =
  | "pending"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled";

/**
 * Available service categories
 */
export type ServiceType =
  | "flatbed_tow"
  | "battery_jumpstart"
  | "fuel_delivery"
  | "tire_change"
  | "lockout"
  | "emergency_rescue"
  | "luxury_transport"
  | "cross_border"
  | "ev_recovery"
  | "car_relocation";

/**
 * Actor allowed to trigger booking transitions
 */
export type Actor = "system" | "driver" | "customer" | "admin";

/**
 * GPS / live fleet location model
 */
export interface LiveLocation {
  flatbed_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  updated_at: string;
}

/**
 * GPS insert payload
 * (used for Supabase inserts)
 */
export interface GPSInsert extends LiveLocation {}

/**
 * Payment record
 */
export interface Payment {
  amount: number | string;
}

/**
 * Booking model
 */
export interface Booking {
  id: string;
  customer_id?: string;
  provider_id?: string;

  status: BookingStatus;
  service_type: ServiceType;

  pickup_location?: string;
  dropoff_location?: string;

  estimated_price?: number;
  final_price?: number;

  created_at?: string;
  updated_at?: string;
}
