import { calcFare } from "@/lib/utils";
import { QuoteSchema } from "@/schemas/booking.schema";
import type { ServiceType } from "@/types";
import { NextRequest, NextResponse } from "next/server";

const VALID_SERVICES: ServiceType[] = [
  "flatbed_tow",
  "battery_jumpstart",
  "fuel_delivery",
  "tire_change",
  "lockout",
  "emergency_rescue",
  "luxury_transport",
  "cross_border",
  "ev_recovery",
  "car_relocation",
];

function isServiceType(value: string): value is ServiceType {
  return VALID_SERVICES.includes(value as ServiceType);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const service_type = searchParams.get("service_type") ?? "";
    const distance_km = Number(searchParams.get("distance_km"));

    if (!isServiceType(service_type)) {
      return NextResponse.json(
        { error: "Invalid service_type" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(distance_km)) {
      return NextResponse.json(
        { error: "Invalid distance_km" },
        { status: 400 },
      );
    }

    const parsed = QuoteSchema.safeParse({
      service_type,
      distance_km,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid quote request",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const fare = calcFare(distance_km, service_type);

    return NextResponse.json({
      success: true,
      data: fare,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
