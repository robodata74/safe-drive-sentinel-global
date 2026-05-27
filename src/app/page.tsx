import Link from 'next/link'
import { Shield, MapPin, CreditCard, Zap, Globe, Star, ArrowRight, Truck } from 'lucide-react'

const services = [
  { icon: Zap,    label: 'Emergency Rescue',    desc: '24/7 rapid response' },
  { icon: Truck,  label: 'Flatbed Towing',       desc: 'All vehicle types' },
  { icon: Star,   label: 'Luxury Transport',     desc: 'Premium handling' },
  { icon: Globe,  label: 'Cross-Border',         desc: 'International routes' },
]

const stats = [
  { value: '50+',   label: 'Countries' },
  { value: '2,400+', label: 'Verified providers' },
  { value: '4.9★',  label: 'Average rating' },
  { value: '<5min', label: 'Avg response' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-navy-950 text-slate-100 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-navy-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">SafeDrive Sentinel</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="#services" className="hover:text-white transition-colors">Services</Link>
            <Link href="#providers" className="hover:text-white transition-colors">For Providers</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm px-3 py-2">Sign in</Link>
            <Link href="/auth/register" className="btn-primary text-sm px-3 py-2">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(30,107,255,0.12)_0%,transparent_65%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live in 50+ countries — No Google APIs
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white mb-6 leading-tight">
            Global vehicle rescue,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400"> on demand</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Book a verified flatbed provider in minutes. Live GPS tracking, instant quotes,
            PayPal payments. Available anywhere, 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base">
              Book a rescue <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/register?role=provider" className="btn-ghost flex items-center justify-center gap-2 px-6 py-3 text-base">
              Register your fleet
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-semibold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-white text-center mb-4">Every rescue scenario covered</h2>
          <p className="text-slate-400 text-center mb-12">From emergency breakdown to luxury transport</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card p-6 text-center hover:bg-white/[0.07] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <div className="font-medium text-white text-sm mb-1">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-white text-center mb-12">3 steps to rescue</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: MapPin,       title: 'Pin your location', desc: 'Drop a pin on the map or use GPS auto-detect.' },
              { step: '02', icon: Truck,        title: 'Match a provider', desc: 'AI selects the nearest verified flatbed in seconds.' },
              { step: '03', icon: CreditCard,   title: 'Pay securely',     desc: 'PayPal escrow — funds released on completion.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="glass-card p-6 relative overflow-hidden">
                <div className="text-6xl font-bold text-white/[0.04] absolute top-4 right-4 select-none">{step}</div>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <div className="font-medium text-white mb-2">{title}</div>
                <div className="text-sm text-slate-400 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-semibold text-white mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">Join thousands of customers and providers on the platform.</p>
          <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
            Create free account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            <span>© 2025 SafeDrive Sentinel Global</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-slate-300 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
