import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'

const BookingForm = dynamic(() => import('@/components/booking/BookingForm'), { ssr: false })

export default async function BookingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, customer:users(full_name)')
    .eq('customer_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const statusColors: Record<string, string> = {
    searching:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    matched:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
    en_route:   'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    completed:  'text-green-400 bg-green-400/10 border-green-400/20',
    cancelled:  'text-red-400 bg-red-400/10 border-red-400/20',
    in_transit: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your rescue requests</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Bookings list */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-medium text-white">Your bookings</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {!bookings?.length ? (
              <div className="px-5 py-12 text-center">
                <div className="text-3xl mb-3">🚛</div>
                <p className="text-sm text-slate-400">No bookings yet. Create your first rescue request.</p>
              </div>
            ) : bookings.map((b: any) => (
              <Link key={b.id} href={`/dashboard/bookings/${b.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate capitalize">
                    {b.service_type.replace(/_/g,' ')}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {b.pickup_address} → {b.dropoff_address}
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  {b.fare_amount ? formatCurrency(b.fare_amount) : '—'}
                </div>
                <span className={`status-badge ${statusColors[b.status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                  {b.status.replace('_',' ')}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* New booking form */}
        <div>
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-400" /> New rescue request
          </h2>
          <BookingForm />
        </div>
      </div>
    </div>
  )
}
