import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  LayoutDashboard, BookOpen, Truck, BarChart2, Settings,
  LogOut, Shield, MapPin, Users
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/bookings',  icon: BookOpen,        label: 'Bookings' },
  { href: '/dashboard/fleet',     icon: Truck,           label: 'Fleet' },
  { href: '/dashboard/providers', icon: Users,           label: 'Providers' },
  { href: '/dashboard/analytics', icon: BarChart2,       label: 'Analytics' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users').select('full_name, role').eq('id', user.id).single()

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-navy-950/80">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white leading-tight">SafeDrive</div>
            <div className="text-[10px] text-slate-500 leading-tight">Sentinel Global</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400
                         hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <Icon className="w-4 h-4 group-hover:text-brand-400 transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3 space-y-0.5">
          <Link href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <form action="/auth/logout" method="post">
            <button type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-medium text-brand-300">
                {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{profile?.full_name ?? 'User'}</div>
              <div className="text-[10px] text-slate-500 capitalize">{profile?.role ?? 'customer'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
