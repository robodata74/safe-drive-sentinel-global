import { NextRequest, NextResponse } from "next/server";
import { QuoteSchema } from "@/schemas/booking.schema";
import { calcFare } from "@/lib/fare";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const rawInput = {
      service_type: searchParams.get("service_type"),
      distance_km: searchParams.get("distance_km"),
    };

    const input = {
      service_type: rawInput.service_type,
      distance_km: Number(rawInput.distance_km),
    };

    if (!Number.isFinite(input.distance_km)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid distance_km",
        },
        { status: 400 }
      );
    }

    const parsed = QuoteSchema.safeParse(input);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid quote request",
          error: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const fare = calcFare(
      parsed.data.service_type,
      parsed.data.distance_km
    );

    return NextResponse.json({
      success: true,
      data: fare,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}