import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { canTransition, BookingStateMachineError, isFinalState } from '../../../lib/booking-state-machine'
import type { BookingStatus } from '../../../lib/booking-state-machine'

const UpdateStatusSchema = z.object({
  booking_id: z.string().uuid(),
  new_status: z.enum(['accepted','en_route','arrived','loading','in_transit','delivered','completed','cancelled']),
})

function supabase() {
  const cs = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: (list) => { try { list.forEach(({ name, value, options }) => cs.set(name, value, options)) } catch {} } } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const db = supabase()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = UpdateStatusSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })

    const { booking_id, new_status } = parsed.data

    // Fetch current booking
    const { data: booking, error: fetchErr } = await db
      .from('bookings').select('id, status, customer_id, flatbed_id').eq('id', booking_id).single()

    if (fetchErr || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (isFinalState(booking.status as BookingStatus)) {
      return NextResponse.json({ error: `Booking is already ${booking.status}` }, { status: 409 })
    }
    if (!canTransition(booking.status as BookingStatus, new_status as BookingStatus)) {
      return NextResponse.json({ error: `Cannot transition from ${booking.status} to ${new_status}` }, { status: 409 })
    }

    // Build update payload
    const update: Record<string, any> = { status: new_status, updated_at: new Date().toISOString() }
    if (new_status === 'accepted')  update.accepted_at  = new Date().toISOString()
    if (new_status === 'completed') update.completed_at = new Date().toISOString()

    const { data: updated, error: updateErr } = await db
      .from('bookings').update(update).eq('id', booking_id).select('*').single()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

    return NextResponse.json({ booking: updated, transitioned_to: new_status })

  } catch (err: any) {
    console.error('[bookings/status]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
