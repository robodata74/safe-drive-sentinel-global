'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Truck, CreditCard, Loader2, ChevronRight } from 'lucide-react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { formatCurrency, calcFare } from '@/lib/utils'
import type { ServiceType } from '@/types'

const LiveMap = dynamic(() => import('@/components/maps/LiveMap'), { ssr: false })

const SERVICES: { value: ServiceType; label: string; desc: string }[] = [
  { value: 'emergency_rescue',  label: 'Emergency Rescue',   desc: 'Immediate response' },
  { value: 'flatbed_tow',       label: 'Flatbed Tow',        desc: 'Standard towing' },
  { value: 'luxury_transport',  label: 'Luxury Transport',   desc: 'Premium handling' },
  { value: 'cross_border',      label: 'Cross-Border',       desc: 'International' },
  { value: 'ev_recovery',       label: 'EV Recovery',        desc: 'Electric vehicles' },
  { value: 'car_relocation',    label: 'Car Relocation',     desc: 'Long distance' },
]

const STEPS = ['Location', 'Service', 'Details', 'Payment']

export default function BookingForm() {
  const [step, setStep] = useState(0)
  const [pickupLat,  setPickupLat]  = useState<number>()
  const [pickupLng,  setPickupLng]  = useState<number>()
  const [pickupAddr, setPickupAddr] = useState('')
  const [dropoffAddr, setDropoffAddr] = useState('')
  const [dropoffLat, setDropoffLat] = useState<number>()
  const [dropoffLng, setDropoffLng] = useState<number>()
  const [service, setService]       = useState<ServiceType>('flatbed_tow')
  const [vehicleDesc, setVehicleDesc] = useState('')
  const [notes, setNotes]           = useState('')
  const [booking, setBooking]       = useState<any>(null)
  const [paypalOrderId, setPaypalOrderId] = useState('')
  const [loading, setLoading]       = useState(false)

  const distanceKm = 12 // In production: use OpenRouteService API
  const fare = calcFare(distanceKm, service)

  async function createBooking() {
    setLoading(true)
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_type: service,
        pickup_lat: pickupLat, pickup_lng: pickupLng, pickup_address: pickupAddr,
        dropoff_lat: dropoffLat, dropoff_lng: dropoffLng, dropoff_address: dropoffAddr,
        vehicle_description: vehicleDesc, special_notes: notes, distance_km: distanceKm,
      }),
    })
    const data = await res.json()
    setBooking(data.booking)
    setPaypalOrderId(data.paypal_order_id)
    setLoading(false)
    setStep(3)
  }

  function handlePickupSelect(lat: number, lng: number, address: string) {
    setPickupLat(lat); setPickupLng(lng); setPickupAddr(address)
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-white/[0.06]">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${
            i === step ? 'text-brand-400 border-brand-500' :
            i < step   ? 'text-green-400 border-transparent' :
                         'text-slate-600 border-transparent'
          }`}>{s}</div>
        ))}
      </div>

      <div className="p-5">
        {/* Step 0: Location */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="h-56 rounded-xl overflow-hidden border border-white/[0.08]">
              <Suspense fallback={<div className="w-full h-full bg-navy-900 flex items-center justify-center text-slate-500 text-sm">Loading map…</div>}>
                <LiveMap
                  pickupLat={pickupLat} pickupLng={pickupLng}
                  interactive onPickupSelect={handlePickupSelect}
                />
              </Suspense>
            </div>
            <p className="text-xs text-slate-500 text-center">Tap the map to set your pickup location</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Pickup address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                <input value={pickupAddr} onChange={e => setPickupAddr(e.target.value)}
                  placeholder="Your location" className="input-base w-full pl-9" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Drop-off address</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input value={dropoffAddr} onChange={e => setDropoffAddr(e.target.value)}
                  placeholder="Destination" className="input-base w-full pl-9" />
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!pickupAddr || !dropoffAddr}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Service type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Select the service you need</p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setService(value)}
                  className={`text-left p-3 rounded-xl border text-sm transition-all ${
                    service === value
                      ? 'border-brand-500/60 bg-brand-500/10 text-white'
                      : 'border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="font-medium mb-0.5">{label}</div>
                  <div className="text-xs opacity-70">{desc}</div>
                </button>
              ))}
            </div>
            <div className="glass-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Truck className="w-4 h-4 text-slate-500" />
                Estimated fare
              </div>
              <div className="text-base font-semibold text-white">{formatCurrency(fare)}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="btn-ghost flex-1">Back</button>
              <button onClick={() => setStep(2)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Vehicle description</label>
              <input value={vehicleDesc} onChange={e => setVehicleDesc(e.target.value)}
                placeholder="e.g. 2019 Toyota Prado, white, broken axle"
                className="input-base w-full" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Special notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any additional details for the driver…"
                rows={3} className="input-base w-full resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
              <button
                onClick={createBooking}
                disabled={!vehicleDesc || loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <>Review & Pay <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && booking && (
          <div className="space-y-4">
            <div className="glass-card p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Service</span><span className="text-white capitalize">{service.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">From</span><span className="text-white text-right max-w-[200px] truncate">{pickupAddr}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">To</span><span className="text-white text-right max-w-[200px] truncate">{dropoffAddr}</span></div>
              <div className="border-t border-white/[0.08] pt-2 flex justify-between font-medium">
                <span className="text-slate-300">Total</span>
                <span className="text-white text-lg">{formatCurrency(fare)}</span>
              </div>
            </div>

            <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!, currency: 'USD' }}>
              <PayPalButtons
                style={{ layout: 'vertical', color: 'blue', shape: 'rect', height: 44 }}
                createOrder={() => Promise.resolve(paypalOrderId)}
                onApprove={async (data) => {
                  await fetch(`/api/bookings/${booking.id}/capture`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: data.orderID }),
                  })
                  window.location.href = `/dashboard/bookings/${booking.id}`
                }}
              />
            </PayPalScriptProvider>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <CreditCard className="w-3 h-3" />
              Secured by PayPal · Funds held until delivery
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
