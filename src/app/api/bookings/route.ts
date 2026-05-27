import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcFare } from '@/lib/utils'

// POST /api/bookings — create booking + PayPal order
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    service_type, pickup_lat, pickup_lng, pickup_address,
    dropoff_lat, dropoff_lng, dropoff_address,
    vehicle_description, special_notes, distance_km
  } = body

  const fare = calcFare(distance_km ?? 10, service_type)

  // Insert booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: user.id,
      service_type,
      status: 'searching',
      pickup_location:  `POINT(${pickup_lng} ${pickup_lat})`,
      pickup_address,
      dropoff_location: `POINT(${dropoff_lng} ${dropoff_lat})`,
      dropoff_address,
      vehicle_description,
      special_notes,
      distance_km,
      fare_amount: fare,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Create PayPal order
  const paypalOrder = await createPaypalOrder(fare, booking.id)

  // Insert pending payment record
  const commission = fare * Number(process.env.COMMISSION_RATE ?? 0.18)
  await supabase.from('payments').insert({
    booking_id:        booking.id,
    paypal_order_id:   paypalOrder.id,
    amount:            fare,
    commission_pct:    Number(process.env.COMMISSION_RATE ?? 0.18),
    commission_amount: commission,
    provider_payout:   fare - commission,
    currency:         'USD',
    status:           'pending',
  })

  return NextResponse.json({ booking, paypal_order_id: paypalOrder.id })
}

// GET /api/bookings — list bookings for current user
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  let query = supabase.from('bookings')
    .select('*, customer:users(full_name, phone), flatbed:flatbeds(plate_number, make, model)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'customer') {
    query = query.eq('customer_id', user.id)
  }

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}

// ─── PayPal helpers ───────────────────────────────────────
async function getPaypalToken() {
  const credentials = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const isLive = process.env.NEXT_PUBLIC_PAYPAL_ENV === 'live'
  const base   = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method:  'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  })
  const data = await res.json()
  return { token: data.access_token, base }
}

async function createPaypalOrder(amount: number, bookingId: string) {
  const { token, base } = await getPaypalToken()

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: bookingId,
        amount: { currency_code: 'USD', value: amount.toFixed(2) },
        description: 'SafeDrive Sentinel — Vehicle Rescue Service',
      }],
    }),
  })
  return res.json()
}
