import { canTransition, isFinalState } from "@/lib/booking-state-machine";
import type { BookingStatus } from "@/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * UI / Driver status (external input)
 */
type DriverStatus =
  | "accepted"
  | "en_route"
  | "arrived"
  | "loading"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled";

/**
 * Map driver status → internal booking status (DOMAIN TRUTH)
 */
const DRIVER_TO_BOOKING_STATUS: Record<DriverStatus, BookingStatus> = {
  accepted: "matched",
  en_route: "in_progress",
  arrived: "in_progress",
  loading: "in_progress",
  in_transit: "in_progress",
  delivered: "completed",
  completed: "completed",
  cancelled: "cancelled",
};

const UpdateStatusSchema = z.object({
  booking_id: z.string().uuid(),
  new_status: z.enum([
    "accepted",
    "en_route",
    "arrived",
    "loading",
    "in_transit",
    "delivered",
    "completed",
    "cancelled",
  ]),
});

function supabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) => {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            }
          } catch {
            // SSR-safe fallback (ignore cookie write failures)
          }
        },
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const db = supabase();

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = UpdateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { booking_id, new_status } = parsed.data;

  /**
   * Convert external status → internal domain status
   */
  const mappedStatus = DRIVER_TO_BOOKING_STATUS[new_status];

  const { data: booking, error } = await db
    .from("bookings")
    .select("id, status")
    .eq("id", booking_id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentStatus = booking.status as BookingStatus;

  /**
   * Final state guard
   */
  if (isFinalState(currentStatus)) {
    return NextResponse.json(
      { error: "Booking already in final state" },
      { status: 409 },
    );
  }

  /**
   * Transition validation (SAFE DOMAIN STATUS ONLY)
   */
  if (!canTransition(currentStatus, mappedStatus)) {
    return NextResponse.json(
      {
        error: `Invalid transition: ${currentStatus} → ${mappedStatus}`,
      },
      { status: 409 },
    );
  }

  /**
   * Update DB
   */
  const { data: updated, error: updateErr } = await db
    .from("bookings")
    .update({
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking_id)
    .select("*")
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({
    booking: updated,
    transitioned_to: mappedStatus,
  });
}
