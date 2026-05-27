import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/gps — driver submits live location
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { flatbed_id, lat, lng, speed_kmh, heading, booking_id } = await req.json()

  // Verify driver is assigned to this flatbed
  const { data: flatbed } = await supabase
    .from('flatbeds').select('id').eq('id', flatbed_id).eq('assigned_driver_id', user.id).single()

  if (!flatbed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Upsert last location on flatbed + insert track point
  await Promise.all([
    supabase.from('flatbeds').update({
      last_location:    `POINT(${lng} ${lat})`,
      last_location_at: new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    }).eq('id', flatbed_id),

    supabase.from('gps_tracks').insert({
      flatbed_id,
      booking_id: booking_id ?? null,
      location:   `POINT(${lng} ${lat})`,
      speed_kmh,
      heading,
    }),
  ])

  return NextResponse.json({ ok: true })
}

// GET /api/gps?flatbed_id=xxx — last known location
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const flatbedId = req.nextUrl.searchParams.get('flatbed_id')
  if (!flatbedId) return NextResponse.json({ error: 'flatbed_id required' }, { status: 400 })

  const { data } = await supabase
    .from('gps_tracks')
    .select('lat:st_y(location), lng:st_x(location), speed_kmh, heading, recorded_at')
    .eq('flatbed_id', flatbedId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(data)
}
