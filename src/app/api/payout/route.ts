import { calculatePayout } from "@/lib/payments/payoutEngine";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function supabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { booking_id, driver_id, total_amount } = body;

    if (!booking_id || !driver_id || !total_amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { platformFee, ownerPayout } = calculatePayout(Number(total_amount));

    const db = supabase();

    const { data, error } = await db
      .from("wallet_transactions")
      .insert({
        booking_id,
        driver_id,
        total_amount,
        platform_fee: platformFee,
        owner_payout: ownerPayout,
        currency: "USD",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transaction: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
