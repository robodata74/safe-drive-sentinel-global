'use client'

import LiveMap from '@/components/maps/LiveMap'

export default function TestMapPage() {
  return (
    <div className="w-full h-screen bg-black">
      <div className="p-3 text-white">
        <h1 className="text-lg font-bold">SafeDrive Map Test</h1>
        <p className="text-sm text-slate-400">
          Testing MapLibre + GPS rendering
        </p>
      </div>

      <div className="h-[90vh]">
        <LiveMap
          pickupLat={-1.2921}
          pickupLng={36.8219}
          dropoffLat={-1.3}
          dropoffLng={36.9}
          truckLocations={[
            {
              flatbed_id: 'TEST-1',
              lat: -1.2921,
              lng: 36.8219,
            },
            {
              flatbed_id: 'TEST-2',
              lat: -1.295,
              lng: 36.83,
            },
          ]}
        />
      </div>
    </div>
  )
}