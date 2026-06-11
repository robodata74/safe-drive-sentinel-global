export interface RawBookingInput {
  service_type?: string;

  pickup_lat?: number;
  pickup_lng?: number;

  dropoff_lat?: number;
  dropoff_lng?: number;

  notes?: string;
}

export function normalizeBooking(input: RawBookingInput) {
  if (
    input.pickup_lat == null ||
    input.pickup_lng == null ||
    input.dropoff_lat == null ||
    input.dropoff_lng == null ||
    !input.service_type
  ) {
    throw new Error("Missing required booking fields");
  }

  return {
    service_type: input.service_type,
    pickup: {
      lat: input.pickup_lat,
      lng: input.pickup_lng,
    },
    dropoff: {
      lat: input.dropoff_lat,
      lng: input.dropoff_lng,
    },
    notes: input.notes ?? "",
  };
}
