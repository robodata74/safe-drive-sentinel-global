'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const revenueData = [
  { day: 'Mon', booking: 1840, subscription: 420 },
  { day: 'Tue', booking: 2100, subscription: 420 },
  { day: 'Wed', booking: 1650, subscription: 640 },
  { day: 'Thu', booking: 2800, subscription: 420 },
  { day: 'Fri', booking: 3200, subscription: 860 },
  { day: 'Sat', booking: 2900, subscription: 420 },
  { day: 'Sun', booking: 2100, subscription: 420 },
]

const bookingTrend = [
  { hour: '00', bookings: 2 },
  { hour: '04', bookings: 1 },
  { hour: '08', bookings: 12 },
  { hour: '12', bookings: 18 },
  { hour: '16', bookings: 22 },
  { hour: '20', bookings: 14 },
]

const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
}

export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Revenue and booking trends</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by day */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-medium text-white mb-4">Weekly revenue by stream</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barSize={16} barGap={4}>
              <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="booking" fill="#1e6bff" name="Bookings" radius={[3,3,0,0]} />
              <Bar dataKey="subscription" fill="#06b6d4" name="Subscriptions" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking volume by hour */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-medium text-white mb-4">Bookings by hour (today)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bookingTrend}>
              <XAxis dataKey="hour" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={false} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-medium text-white mb-4">Revenue streams</h2>
        <div className="space-y-3">
          {[
            { label: 'Booking commissions (18%)', amount: 12840, pct: 56 },
            { label: 'Provider subscriptions',    amount: 6420,  pct: 28 },
            { label: 'Priority rescue fees',      amount: 2380,  pct: 10 },
            { label: 'Premium placement',         amount: 1260,  pct: 6  },
          ].map(({ label, amount, pct }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300">{label}</span>
                <span className="text-white font-medium">${amount.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-navy-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                     style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
