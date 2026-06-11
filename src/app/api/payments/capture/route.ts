import { canTransition } from "@/lib/booking-state-machine";
import { capturePayPalOrder } from "@/lib/paypal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BookingStatus } from "@/types";
import { NextRequest, NextResponse } from "next/server";

type CaptureRequestBody = {
  orderID: string;
  booking_id: string;
};

/**
 * Payment success → booking lifecycle state
 */
const PAYMENT_BOOKING_STATUS: BookingStatus = "matched";

export async function POST(req: NextRequest) {
  try {
    const body: CaptureRequestBody = await req.json();

    const { orderID, booking_id } = body;

    if (!orderID || !booking_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing orderID or booking_id",
        },
        { status: 400 },
      );
    }

    /**
     * Capture PayPal payment
     */
    const capture = await capturePayPalOrder(orderID);

    const captureStatus =
      capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status;

    if (captureStatus !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment capture failed",
        },
        { status: 400 },
      );
    }

    /**
     * Fetch booking
     */
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 },
      );
    }

    const currentStatus = booking.status as BookingStatus;

    /**
     * Validate transition
     */
    if (!canTransition(currentStatus, PAYMENT_BOOKING_STATUS)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition: ${currentStatus} → ${PAYMENT_BOOKING_STATUS}`,
        },
        { status: 409 },
      );
    }

    /**
     * Update booking
     */
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: PAYMENT_BOOKING_STATUS,
        payment_status: "paid",
        paypal_order_id: orderID,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      payment_status: "paid",
      booking_status: PAYMENT_BOOKING_STATUS,
      paypal_capture: capture,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
