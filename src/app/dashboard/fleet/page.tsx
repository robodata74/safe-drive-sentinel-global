import { createClient } from '@/lib/supabase/server'
import { Truck, Plus, Circle } from 'lucide-react'

export default async function FleetPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get provider for this user
  const { data: provider } = await supabase
    .from('providers').select('id, company_name').eq('owner_id', user!.id).single()

  const { data: flatbeds } = provider ? await supabase
    .from('flatbeds')
    .select('*, assigned_driver:users(full_name, phone)')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false }) : { data: [] }

  const statusDot: Record<string, string> = {
    available:   'text-green-400',
    on_job:      'text-blue-400',
    offline:     'text-slate-500',
    maintenance: 'text-orange-400',
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Fleet</h1>
          <p className="text-sm text-slate-500 mt-0.5">{provider?.company_name ?? 'Manage your flatbeds'}</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add flatbed
        </button>
      </div>

      {!provider ? (
        <div className="glass-card p-12 text-center">
          <Truck className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">You haven&apos;t registered as a provider yet.</p>
          <a href="/dashboard/providers/register" className="btn-primary text-sm">Register as provider</a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {flatbeds?.map((f: any) => (
            <div key={f.id} className="glass-card p-4 hover:bg-white/[0.06] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-400" />
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${statusDot[f.status]}`}>
                  <Circle className="w-2 h-2 fill-current" />
                  {f.status.replace('_', ' ')}
                </div>
              </div>
              <div className="font-medium text-white text-sm mb-1">
                {f.make} {f.model} ({f.year})
              </div>
              <div className="text-xs text-slate-500 mb-3">{f.plate_number} · {f.capacity_tons}t · {f.flatbed_type}</div>
              {f.assigned_driver ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <span className="text-[9px] text-green-400">{f.assigned_driver.full_name[0]}</span>
                  </div>
                  <span className="text-xs text-slate-400">{f.assigned_driver.full_name}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-600">No driver assigned</span>
              )}
            </div>
          ))}

          {/* Add flatbed card */}
          <div className="glass-card p-4 border-dashed flex flex-col items-center justify-center gap-2 min-h-[140px] cursor-pointer hover:bg-white/[0.04] transition-colors">
            <div className="w-10 h-10 rounded-xl border border-white/[0.12] flex items-center justify-center">
              <Plus className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-xs text-slate-500">Add flatbed</span>
          </div>
        </div>
      )}
    </div>
  )
}
