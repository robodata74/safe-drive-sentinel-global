import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}min` : `${h}h`;
}

/**
 * FIXED: consistent fare function
 */
export function calcFare(distanceKm: number, serviceType: string): number {
  const base = 20;
  const rate = 2.5;

  const multipliers: Record<string, number> = {
    emergency_rescue: 1.8,
    flatbed_tow: 1.2,
    luxury_transport: 2.5,
    cross_border: 3.0,
    ev_recovery: 1.6,
    car_relocation: 1.4,
  };

  const multiplier = multipliers[serviceType] ?? 1;

  return Math.round((base + distanceKm * rate) * multiplier * 100) / 100;
}
