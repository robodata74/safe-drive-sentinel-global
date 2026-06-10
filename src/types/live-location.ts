export interface LiveLocation {
  driver_id: string;

  lat: number;
  lng: number;

  speed?: number;
  heading?: number;

  updated_at?: number;
}
