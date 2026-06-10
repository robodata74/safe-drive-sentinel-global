export interface CreateBookingPayload {
  service_type: string;

  pickup_lat: number;
  pickup_lng: number;

  dropoff_lat: number;
  dropoff_lng: number;

  pickup_address?: string;
  dropoff_address?: string;

  vehicle_description?: string;
  special_notes?: string;

  distance_km?: number;
}
