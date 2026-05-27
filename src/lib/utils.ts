import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    searching:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    matched:      'text-blue-400 bg-blue-400/10 border-blue-400/20',
    accepted:     'text-blue-400 bg-blue-400/10 border-blue-400/20',
    en_route:     'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    arrived:      'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    loading:      'text-purple-400 bg-purple-400/10 border-purple-400/20',
    in_transit:   'text-purple-400 bg-purple-400/10 border-purple-400/20',
    delivered:    'text-green-400 bg-green-400/10 border-green-400/20',
    completed:    'text-green-400 bg-green-400/10 border-green-400/20',
    cancelled:    'text-red-400 bg-red-400/10 border-red-400/20',
    available:    'text-green-400 bg-green-400/10 border-green-400/20',
    on_job:       'text-blue-400 bg-blue-400/10 border-blue-400/20',
    offline:      'text-slate-400 bg-slate-400/10 border-slate-400/20',
    maintenance:  'text-orange-400 bg-orange-400/10 border-orange-400/20',
    pending:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    approved:     'text-green-400 bg-green-400/10 border-green-400/20',
    rejected:     'text-red-400 bg-red-400/10 border-red-400/20',
    active:       'text-green-400 bg-green-400/10 border-green-400/20',
    suspended:    'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return map[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20'
}

export function calcFare(distanceKm: number, serviceType: string): number {
  const baseFares: Record<string, number> = {
    emergency_rescue:  25,
    flatbed_tow:       20,
    luxury_transport:  50,
    cross_border:      80,
    ev_recovery:       30,
    car_relocation:    35,
    fleet_transport:   60,
  }
  const perKm: Record<string, number> = {
    emergency_rescue:  3.5,
    flatbed_tow:       2.5,
    luxury_transport:  5.0,
    cross_border:      4.0,
    ev_recovery:       3.0,
    car_relocation:    3.0,
    fleet_transport:   3.5,
  }
  const base = baseFares[serviceType] ?? 20
  const rate = perKm[serviceType] ?? 2.5
  return Math.round((base + distanceKm * rate) * 100) / 100
}
