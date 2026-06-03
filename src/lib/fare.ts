import type { ServiceType } from "@/types";

const BASE_FARES: Record<ServiceType, number> = {
  flatbed_tow: 2500,
  battery_jumpstart: 1500,
  fuel_delivery: 1200,
  tire_change: 1000,
  lockout: 1200,
  emergency_rescue: 5000,
  luxury_transport: 4500,
  cross_border: 8000,
  ev_recovery: 3500,
  car_relocation: 6000,
};

export function calcFare(serviceType: ServiceType, distanceKm: number): number {
  const base = BASE_FARES[serviceType] ?? 1500;

  const perKm = 100;

  return Math.round(base + distanceKm * perKm);
}
