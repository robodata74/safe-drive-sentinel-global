import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Admin client bypasses RLS for webhook processing
function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = adminClient()

  const { event_type, resource } = body

  switch (event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED': {
      // Payment captured — mark payment + booking as paid / accepted
      const orderId = resource.supplementary_data?.related_ids?.order_id
      if (!orderId) break

      const { data: payment } = await supabase
        .from('payments').select('booking_id').eq('paypal_order_id', orderId).single()

      if (payment) {
        await Promise.all([
          supabase.from('payments')
            .update({ status: 'captured', paypal_capture_id: resource.id })
            .eq('paypal_order_id', orderId),
          supabase.from('bookings')
            .update({ status: 'matched' })
            .eq('id', payment.booking_id)
            .eq('status', 'searching'),
        ])
      }
      break
    }

    case 'PAYMENT.CAPTURE.REFUNDED': {
      const captureId = resource.id
      await supabase.from('payments')
        .update({ status: 'refunded' })
        .eq('paypal_capture_id', captureId)
      break
    }

    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      // Provider subscription activated
      const subscriptionId = resource.id
      const tier = mapSubscriptionToTier(resource.plan_id)
      await supabase.from('providers')
        .update({ subscription_tier: tier })
        .eq('paypal_subscription_id', subscriptionId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

function mapSubscriptionToTier(planId: string): string {
  const map: Record<string, string> = {
    [process.env.PAYPAL_PLAN_STARTER     ?? '']: 'starter',
    [process.env.PAYPAL_PLAN_PRO         ?? '']: 'pro',
    [process.env.PAYPAL_PLAN_ENTERPRISE  ?? '']: 'enterprise',
  }
  return map[planId] ?? 'free'
}
