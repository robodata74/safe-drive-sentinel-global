'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { LiveLocation } from '@/types'

interface Props {
  pickupLat?: number
  pickupLng?: number
  dropoffLat?: number
  dropoffLng?: number
  truckLocations?: LiveLocation[]
  interactive?: boolean
  onPickupSelect?: (lat: number, lng: number, address: string) => void
}

export default function LiveMap({
  pickupLat, pickupLng, dropoffLat, dropoffLng,
  truckLocations = [], interactive = false, onPickupSelect,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Dynamic import to avoid SSR issues
    import('maplibre-gl').then(({ default: maplibregl }) => {
      import('maplibre-gl/dist/maplibre-gl.css')

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: [pickupLng ?? 36.8219, pickupLat ?? -1.2921], // Default: Nairobi
        zoom: 12,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      if (interactive && onPickupSelect) {
        map.on('click', async (e) => {
          const { lng, lat } = e.lngLat
          // Reverse geocode via Nominatim (free, no API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          )
          const data = await res.json()
          onPickupSelect(lat, lng, data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        })
        map.getCanvas().style.cursor = 'crosshair'
      }

      mapRef.current = map
    })

    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // Update pickup marker
  useEffect(() => {
    if (!mapRef.current || !pickupLat || !pickupLng) return
    import('maplibre-gl').then(({ default: maplibregl }) => {
      markersRef.current.get('pickup')?.remove()
      const el = document.createElement('div')
      el.className = 'w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-lg'
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pickupLng, pickupLat])
        .addTo(mapRef.current)
      markersRef.current.set('pickup', marker)
      mapRef.current.flyTo({ center: [pickupLng, pickupLat], zoom: 13 })
    })
  }, [pickupLat, pickupLng])

  // Update dropoff marker
  useEffect(() => {
    if (!mapRef.current || !dropoffLat || !dropoffLng) return
    import('maplibre-gl').then(({ default: maplibregl }) => {
      markersRef.current.get('dropoff')?.remove()
      const el = document.createElement('div')
      el.className = 'w-4 h-4 rounded-full bg-red-400 border-2 border-white shadow-lg'
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([dropoffLng, dropoffLat])
        .addTo(mapRef.current)
      markersRef.current.set('dropoff', marker)
    })
  }, [dropoffLat, dropoffLng])

  // Update truck markers
  useEffect(() => {
    if (!mapRef.current) return
    import('maplibre-gl').then(({ default: maplibregl }) => {
      truckLocations.forEach((loc) => {
        let marker = markersRef.current.get(`truck-${loc.flatbed_id}`)
        if (!marker) {
          const el = document.createElement('div')
          el.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-xs">🚛</div>`
          marker = new maplibregl.Marker({ element: el.firstChild as HTMLElement })
            .setLngLat([loc.lng, loc.lat])
            .addTo(mapRef.current)
          markersRef.current.set(`truck-${loc.flatbed_id}`, marker)
        } else {
          marker.setLngLat([loc.lng, loc.lat])
        }
      })
    })
  }, [truckLocations])

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
  )
}
