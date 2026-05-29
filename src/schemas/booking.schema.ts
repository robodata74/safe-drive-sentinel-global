import { z } from "zod";

/**
 * =========================================================
 * SAFE DRIVE SENTINEL — BOOKING SCHEMAS (PRODUCTION GRADE)
 * =========================================================
 */

/**
 * -------------------------------
 * SERVICE TYPES
 * -------------------------------
 */
export const ServiceTypeEnum = z.enum([
  "emergency_rescue",
  "flatbed_tow",
  "luxury_transport",
  "cross_border",
  "ev_recovery",
  "car_relocation",
  "fleet_transport",
]);

/**
 * -------------------------------
 * CORE REUSABLE VALIDATORS
 * -------------------------------
 */

const Lat = z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude");
const Lng = z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude");

/**
 * Strict address sanitizer:
 * - trims whitespace
 * - removes empty strings
 */
const Address = z
  .string()
  .trim()
  .min(5, "Address too short")
  .max(300, "Address too long");

/**
 * Optional clean text (NO empty strings allowed)
 */
const OptionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((val) => (val === "" ? undefined : val));

/**
 * -------------------------------
 * CREATE BOOKING
 * -------------------------------
 */
export const CreateBookingSchema = z
  .object({
    service_type: ServiceTypeEnum,

    pickup_lat: Lat,
    pickup_lng: Lng,
    pickup_address: Address,

    dropoff_lat: Lat,
    dropoff_lng: Lng,
    dropoff_address: Address,

    vehicle_description: z
      .string()
      .trim()
      .min(5, "Vehicle description required")
      .max(500),

    special_notes: OptionalText(1000),

    /**
     * IMPORTANT:
     * distance is OPTIONAL because it can be computed server-side
     * BUT must NEVER be negative
     */
    distance_km: z.number().positive().optional(),

    /**
     * Future-proofing for AI dispatch + fraud scoring + routing
     */
    metadata: z.record(z.any()).optional(),
  })
  .strict();

/**
 * -------------------------------
 * CANCEL BOOKING
 * -------------------------------
 */
export const CancelBookingSchema = z
  .object({
    booking_id: z.string().uuid("Invalid booking ID"),
    reason: OptionalText(500),
  })
  .strict();

/**
 * -------------------------------
 * QUOTE REQUEST
 * -------------------------------
 */
export const QuoteSchema = z
  .object({
    service_type: ServiceTypeEnum,

    /**
     * Must be strictly positive for pricing engine stability
     */
    distance_km: z.number().positive("Distance must be greater than 0"),
  })
  .strict();

/**
 * -------------------------------
 * TYPESCRIPT EXPORT TYPES
 * -------------------------------
 */
export type ServiceType = z.infer<typeof ServiceTypeEnum>;

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
export type QuoteInput = z.infer<typeof QuoteSchema>;