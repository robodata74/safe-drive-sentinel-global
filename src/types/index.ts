/**
 * =========================================================
 * SAFE DRIVE GLOBAL — GLOBAL TYPES
 * =========================================================
 */

export type { Database } from "./database.types";

/* ==========================
   DOMAIN TYPES
========================== */

export type UserRole = "customer" | "provider" | "driver" | "admin";

export type BookingStatus =
  | "searching"
  | "matched"
  | "accepted"
  | "en_route"
  | "arrived"
  | "loading"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled";

export type ServiceType =
  | "emergency_rescue"
  | "flatbed_tow"
  | "luxury_transport"
  | "cross_border"
  | "ev_recovery"
  | "car_relocation"
  | "fleet_transport";

export interface LiveLocation {
  flatbed_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  updated_at: string;
}
