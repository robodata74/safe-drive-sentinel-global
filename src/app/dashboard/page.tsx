import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Clock } from 'lucide-react'

async function getDashboardStats(supabase: ReturnType<typeof createClient>) {
  const today = new Date(); today.setHours(0,0,0,0)

  const [{ count: activeBookings }, { data: payments }, { count: activeProviders }] =
    await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true })
        .in('status', ['accepted','en_route','arrived','loading','in_transit']),
      supabase.from('payments').select('amount').eq('status','captured')
        .gte('created_at', today.toISOString()),
      supabase.from('providers').select('*', { count: 'exact', head: true }).eq('status','active'),
    ])

  const revenueToday = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)

  return {
    active_bookings:   activeBookings ?? 0,
    revenue_today:     revenueToday,
    active_providers:  activeProviders ?? 0,
    avg_response_min:  4.2,
  }
}

async function getRecentBookings(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from('bookings')
    .select('id, status, pickup_address, dropoff_address, fare_amount, created_at, customer:users(full_name)')
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

export default async function DashboardPage() {
  const supabase = createClient()
  const [stats, bookings] = await Promise.all([
    getDashboardStats(supabase),
    getRecentBookings(supabase),
  ])

  const metricCards = [
    { label: 'Active bookings',  value: stats.active_bookings,             icon: Activity,    color: 'text-blue-400',  delta: '+12 today', up: true },
    { label: 'Revenue today',    value: formatCurrency(stats.revenue_today), icon: DollarSign,  color: 'text-green-400', delta: '+18% avg',  up: true },
    { label: 'Active providers', value: stats.active_providers,             icon: Users,       color: 'text-amber-400', delta: '+8 this week', up: true },
    { label: 'Avg response',     value: `${stats.avg_response_min}min`,     icon: Clock,       color: 'text-cyan-400',  delta: '-0.8min target', up: false },
  ]

  const statusColors: Record<string, string> = {
    searching:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    matched:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
    en_route:   'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    completed:  'text-green-400 bg-green-400/10 border-green-400/20',
    cancelled:  'text-red-400 bg-red-400/10 border-red-400/20',
    in_transit: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  }

  return (
    <div className="p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Command Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">Live platform metrics</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, icon: Icon, color, delta, up }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-white mb-1">{value}</div>
            <div className={`text-xs flex items-center gap-1 ${up ? 'text-green-400' : 'text-red-400'}`}>
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {delta}
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Recent bookings</h2>
          <a href="/dashboard/bookings" className="text-xs text-brand-400 hover:text-brand-300">View all →</a>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {bookings.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">No bookings yet</div>
          ) : bookings.map((b: any) => (
            <div key={b.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-brand-300">
                  {(b.customer?.full_name ?? 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200 truncate">{b.customer?.full_name ?? 'Customer'}</div>
                <div className="text-xs text-slate-500 truncate">{b.pickup_address} → {b.dropoff_address}</div>
              </div>
              <div className="text-sm text-slate-300">{b.fare_amount ? formatCurrency(b.fare_amount) : '—'}</div>
              <span className={`status-badge ${statusColors[b.status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                {b.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
