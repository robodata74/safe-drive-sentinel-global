import { calcFare } from "@/lib/utils";
import { CreateBookingSchema } from "@/schemas/booking.schema";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

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
          } catch {}
        },
      },
    },
  );
}

export async function POST(req: NextRequest) {
  try {
    const db = supabase();

    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const input = parsed.data;

    const distanceKm = input.distance_km ?? 10;

    const fareAmount = calcFare(distanceKm, input.service_type);

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

        vehicle_description: input.vehicle_description,
        special_notes: input.special_notes ?? null,

        distance_km: distanceKm,
        fare_amount: fareAmount,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ booking, fare: fareAmount });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
