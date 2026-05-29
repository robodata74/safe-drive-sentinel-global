import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CancelBookingSchema } from '../../../schemas/booking.schema'
import { canTransition } from '../../../lib/booking-state-machine'
import type { BookingStatus } from '../../../lib/booking-state-machine'

function supabase() {
  const cs = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: (list) => { try { list.forEach(({ name, value, options }) => cs.set(name, value, options)) } catch {} } } }
  )
}

export async function POST(req: NextRequest) {
  const db = supabase()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CancelBookingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })

  const { booking_id, reason } = parsed.data

  const { data: booking } = await db.from('bookings').select('id, status, customer_id').eq('id', booking_id).single()
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.customer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!canTransition(booking.status as BookingStatus, 'cancelled')) {
    return NextResponse.json({ error: `Cannot cancel from status: ${booking.status}` }, { status: 409 })
  }

  const { data: updated } = await db.from('bookings')
    .update({ status: 'cancelled', special_notes: reason ? `[CANCELLED] ${reason}` : '[CANCELLED]', updated_at: new Date().toISOString() })
    .eq('id', booking_id).select('*').single()

  return NextResponse.json({ booking: updated, cancelled: true })
}
