import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CreateBookingSchema } from '../../../schemas/booking.schema'
import { calcFare } from '../../../lib/fare'

function supabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
      },
    }
  )
}

export async function POST(req: NextRequest) {
  try {
    const db = supabase()
    const { data: { user }, error: authErr } = await db.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = CreateBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const input = parsed.data
    const distanceKm = input.distance_km ?? 10
    const fare = calcFare(input.service_type as any, distanceKm)

    // Estimate duration (avg 40 km/h for urban)
    const estimatedMinutes = Math.round((distanceKm / 40) * 60)

    const { data: booking, error: dbErr } = await db
      .from('bookings')
      .insert({
        customer_id:           user.id,
        service_type:          input.service_type,
        status:                'searching',
        pickup_location:       `POINT(${input.pickup_lng} ${input.pickup_lat})`,
        pickup_address:        input.pickup_address,
        dropoff_location:      `POINT(${input.dropoff_lng} ${input.dropoff_lat})`,
        dropoff_address:       input.dropoff_address,
        vehicle_description:   input.vehicle_description,
        special_notes:         input.special_notes ?? null,
        distance_km:           distanceKm,
        estimated_duration_min: estimatedMinutes,
        fare_amount:           fare.totalFare,
      })
      .select('*')
      .single()

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

    return NextResponse.json({
      booking,
      fare_breakdown: fare,
      next_step: 'proceed_to_payment',
    }, { status: 201 })

  } catch (err: any) {
    console.error('[bookings/create]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
