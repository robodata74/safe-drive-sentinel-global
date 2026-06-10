import { calcFare } from "@/lib/utils";
import { CreateBookingSchema } from "@/schemas/booking.schema";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * =========================
 * TYPES
 * =========================
 */
type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * =========================
 * SUPABASE CLIENT (SERVER SAFE)
 * =========================
 */
function supabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // cookies are read-only in some edge contexts — safe ignore
          }
        },
      },
    },
  );
}

/**
 * =========================
 * SECURITY HELPER (CLEAN)
 * =========================
 */
function validateRequest(req: NextRequest) {
  const method = req.method;

  if (method !== "POST") {
    return { error: "Method not allowed", status: 405 };
  }

  /**
   * NOTE:
   * Origin checks are NOT reliable security.
   * We DO NOT rely on them for protection.
   */

  return null;
}

/**
 * =========================
 * POST /api/bookings/create
 * =========================
 */
export async function POST(req: NextRequest) {
  try {
    /**
     * 1. METHOD GUARD
     */
    const guard = validateRequest(req);
    if (guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status },
      );
    }

    /**
     * 2. INIT DB
     */
    const db = supabase();

    /**
     * 3. AUTHENTICATION (PRIMARY SECURITY LAYER)
     */
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /**
     * 4. PARSE BODY SAFELY
     */
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    /**
     * 5. VALIDATE INPUT (STRICT ZOD)
     */
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const input = parsed.data;

    /**
     * 6. HARD VALIDATION (NO GARBAGE GPS)
     */
    const validCoords =
      Number.isFinite(input.pickup_lat) &&
      Number.isFinite(input.pickup_lng) &&
      Number.isFinite(input.dropoff_lat) &&
      Number.isFinite(input.dropoff_lng);

    if (!validCoords) {
      return NextResponse.json(
        {
          error: "Invalid coordinates",
        },
        { status: 422 },
      );
    }

    /**
     * 7. BUSINESS LOGIC
     */
    const distanceKm = input.distance_km ?? 10;
    const fareAmount = calcFare(distanceKm, input.service_type);

    /**
     * 8. DATABASE WRITE (TRUSTED ONLY)
     */
    const { data: booking, error } = await db
      .from("bookings")
      .insert({
        customer_id: user.id,
        service_type: input.service_type,
        status: "pending",

        pickup_address: input.pickup_address,
        dropoff_address: input.dropoff_address,

        pickup_location: `POINT(${input.pickup_lng} ${input.pickup_lat})`,
        dropoff_location: `POINT(${input.dropoff_lng} ${input.dropoff_lat})`,

        vehicle_description: input.vehicle_description ?? null,

        special_notes: input.special_notes ?? null,

        distance_km: distanceKm,
        fare_amount: fareAmount,
      })
      .select("*")
      .single();

    if (error) {
      console.error("DB ERROR:", error);

      return NextResponse.json(
        { error: "Database insert failed" },
        { status: 500 },
      );
    }

    /**
     * 9. SUCCESS RESPONSE
     */
    return NextResponse.json({
      success: true,
      booking,
      fare: fareAmount,
    });
  } catch (err) {
    console.error("CRITICAL API FAILURE:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
