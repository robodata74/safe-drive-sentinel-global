import { createClient } from '@/lib/supabase/server'
import { Star, Shield, CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function ProvidersPage() {
  const supabase = createClient()

  const { data: providers } = await supabase
    .from('providers')
    .select('*, owner:users(full_name, email, kyc_status)')
    .order('created_at', { ascending: false })
    .limit(30)

  const statusIcon = {
    pending:   <Clock className="w-4 h-4 text-yellow-400" />,
    active:    <CheckCircle className="w-4 h-4 text-green-400" />,
    suspended: <XCircle className="w-4 h-4 text-red-400" />,
  }

  const tierColors: Record<string, string> = {
    free:       'text-slate-400 bg-slate-400/10 border-slate-400/20',
    starter:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
    pro:        'text-purple-400 bg-purple-400/10 border-purple-400/20',
    enterprise: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Providers</h1>
        <p className="text-sm text-slate-500 mt-0.5">KYC review & provider management</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] grid grid-cols-[1fr_140px_100px_100px_80px] gap-4 text-xs text-slate-500 uppercase tracking-wide">
          <span>Company</span>
          <span>Owner</span>
          <span>KYC</span>
          <span>Tier</span>
          <span>Rating</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {!providers?.length ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No providers yet</div>
          ) : providers.map((p: any) => (
            <div key={p.id}
              className="px-5 py-3.5 grid grid-cols-[1fr_140px_100px_100px_80px] gap-4 items-center hover:bg-white/[0.02] transition-colors">
              <div>
                <div className="text-sm text-white font-medium flex items-center gap-2">
                  {statusIcon[p.status as keyof typeof statusIcon]}
                  {p.company_name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {p.service_regions?.slice(0,2).join(', ') ?? 'No regions'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-300 truncate">{p.owner?.full_name ?? '—'}</div>
                <div className="text-xs text-slate-500 truncate">{p.owner?.email ?? '—'}</div>
              </div>
              <div>
                <span className={`status-badge text-xs ${
                  p.owner?.kyc_status === 'approved' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  p.owner?.kyc_status === 'pending'  ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                  'text-red-400 bg-red-400/10 border-red-400/20'
                }`}>
                  {p.owner?.kyc_status ?? 'unknown'}
                </span>
              </div>
              <div>
                <span className={`status-badge text-xs ${tierColors[p.subscription_tier] ?? ''}`}>
                  {p.subscription_tier}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                {Number(p.rating).toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
