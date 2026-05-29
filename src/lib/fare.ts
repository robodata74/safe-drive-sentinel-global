export type ServiceType =
  | "emergency_rescue"
  | "flatbed_tow"
  | "luxury_transport"
  | "cross_border"
  | "ev_recovery"
  | "car_relocation"
  | "fleet_transport";

interface FareConfig {
  baseFare: number;
  perKmRate: number;
  minFare: number;
  surgeWindows: Array<{ start: number; end: number }>;
  surgeMultiplier: number;
}

const FARE_CONFIG: Record<ServiceType, FareConfig> = {
  emergency_rescue: {
    baseFare: 25,
    perKmRate: 3.5,
    minFare: 35,
    surgeWindows: [
      { start: 0, end: 6 },
      { start: 18, end: 24 },
    ],
    surgeMultiplier: 1.4,
  },

  flatbed_tow: {
    baseFare: 20,
    perKmRate: 2.5,
    minFare: 25,
    surgeWindows: [],
    surgeMultiplier: 1.0,
  },

  luxury_transport: {
    baseFare: 50,
    perKmRate: 5,
    minFare: 80,
    surgeWindows: [],
    surgeMultiplier: 1.0,
  },

  cross_border: {
    baseFare: 80,
    perKmRate: 4,
    minFare: 120,
    surgeWindows: [],
    surgeMultiplier: 1.0,
  },

  ev_recovery: {
    baseFare: 30,
    perKmRate: 3,
    minFare: 40,
    surgeWindows: [{ start: 0, end: 6 }],
    surgeMultiplier: 1.25,
  },

  car_relocation: {
    baseFare: 35,
    perKmRate: 3,
    minFare: 50,
    surgeWindows: [],
    surgeMultiplier: 1.0,
  },

  fleet_transport: {
    baseFare: 60,
    perKmRate: 3.5,
    minFare: 90,
    surgeWindows: [],
    surgeMultiplier: 1.0,
  },
};

const COMMISSION_RATE = Number(process.env.COMMISSION_RATE ?? 0.18);

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  rawSubtotal: number;
  subtotal: number;
  minFareApplied: boolean;
  surgeMultiplier: number;
  totalFare: number;
  commission: number;
  providerPayout: number;
  currency: string;
}

/**
 * SURGE CHECK
 */
function isSurgeHour(windows: FareConfig["surgeWindows"]): boolean {
  if (!windows.length) return false;

  const hour = new Date().getHours();

  return windows.some(({ start, end }) => hour >= start && hour < end);
}

/**
 * ROUNDING
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * FARE ENGINE
 */
export function calcFare(
  serviceType: ServiceType,
  distanceKm: number
): FareBreakdown {
  const cfg = FARE_CONFIG[serviceType];

  const safeDistance = Math.max(Number(distanceKm) || 0, 0);

  const distanceCharge = safeDistance * cfg.perKmRate;

  const rawSubtotal = cfg.baseFare + distanceCharge;

  const minFareApplied = rawSubtotal < cfg.minFare;

  const subtotal = minFareApplied ? cfg.minFare : rawSubtotal;

  const surgeMultiplier = isSurgeHour(cfg.surgeWindows)
    ? cfg.surgeMultiplier
    : 1;

  const totalFare = subtotal * surgeMultiplier;

  const commission = totalFare * COMMISSION_RATE;

  const providerPayout = totalFare - commission;

  return {
    baseFare: cfg.baseFare,
    distanceCharge: round(distanceCharge),

    rawSubtotal: round(rawSubtotal),
    subtotal: round(subtotal),

    minFareApplied,
    surgeMultiplier,

    totalFare: round(totalFare),
    commission: round(commission),
    providerPayout: round(providerPayout),

    currency: "USD",
  };
}

/**
 * FORMATTER
 */
export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}