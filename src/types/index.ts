// ─── User & Auth ──────────────────────────────────────────
export type UserRole = 'customer' | 'provider' | 'driver' | 'admin'
export type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  phone?: string
  full_name: string
  avatar_url?: string
  role: UserRole
  kyc_status: KycStatus
  paypal_id?: string
  created_at: string
}

// ─── Provider & Fleet ─────────────────────────────────────
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise'
export type ProviderStatus = 'pending' | 'active' | 'suspended'

export interface Provider {
  id: string
  owner_id: string
  company_name: string
  license_url?: string
  insurance_url?: string
  service_regions: string[]
  rating: number
  total_reviews: number
  subscription_tier: SubscriptionTier
  status: ProviderStatus
  created_at: string
  owner?: User
}

// ─── Flatbed ───────────────────────────────────────────────
export type FlatbedStatus = 'available' | 'on_job' | 'offline' | 'maintenance'
export type FlatbedType = 'standard' | 'lowboy' | 'rollback' | 'heavy_duty' | 'luxury'

export interface Flatbed {
  id: string
  provider_id: string
  assigned_driver_id?: string
  plate_number: string
  make: string
  model: string
  year: number
  flatbed_type: FlatbedType
  capacity_tons: number
  status: FlatbedStatus
  last_lat?: number
  last_lng?: number
  last_location_at?: string
  photo_url?: string
  created_at: string
  provider?: Provider
  assigned_driver?: User
}

// ─── Booking ──────────────────────────────────────────────
export type BookingStatus =
  | 'searching'
  | 'matched'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'loading'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type ServiceType =
  | 'emergency_rescue'
  | 'flatbed_tow'
  | 'luxury_transport'
  | 'cross_border'
  | 'ev_recovery'
  | 'car_relocation'
  | 'fleet_transport'

export interface Booking {
  id: string
  customer_id: string
  flatbed_id?: string
  service_type: ServiceType
  status: BookingStatus
  pickup_lat: number
  pickup_lng: number
  pickup_address: string
  dropoff_lat: number
  dropoff_lng: number
  dropoff_address: string
  vehicle_description: string
  special_notes?: string
  distance_km?: number
  estimated_duration_min?: number
  fare_amount?: number
  final_amount?: number
  created_at: string
  accepted_at?: string
  completed_at?: string
  customer?: User
  flatbed?: Flatbed
  payment?: Payment
}

// ─── Payment ──────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'captured' | 'held' | 'released' | 'refunded' | 'failed'

export interface Payment {
  id: string
  booking_id: string
  paypal_order_id?: string
  paypal_capture_id?: string
  amount: number
  commission_pct: number
  commission_amount: number
  provider_payout: number
  currency: string
  status: PaymentStatus
  created_at: string
  settled_at?: string
}

// ─── GPS Tracking ─────────────────────────────────────────
export interface GpsTrack {
  id: number
  flatbed_id: string
  booking_id?: string
  lat: number
  lng: number
  speed_kmh?: number
  heading?: number
  recorded_at: string
}

export interface LiveLocation {
  flatbed_id: string
  lat: number
  lng: number
  speed_kmh: number
  heading: number
  timestamp: number
}

// ─── UI Helpers ───────────────────────────────────────────
export interface MapMarker {
  id: string
  lat: number
  lng: number
  type: 'truck' | 'pickup' | 'dropoff' | 'customer'
  label?: string
  status?: FlatbedStatus
}

export interface DashboardStats {
  active_bookings: number
  revenue_today: number
  active_providers: number
  avg_response_min: number
  bookings_delta: number
  revenue_delta: number
}
