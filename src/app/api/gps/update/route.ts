import { canTransition } from "@/lib/booking-state-machine";
import { capturePayPalOrder } from "@/lib/paypal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BookingStatus } from "@/types";
import { NextRequest, NextResponse } from "next/server";

type CapturePayload = {
  orderID: string;
  booking_id: string;
};

/**
 * Payment success → booking lifecycle state
 *
 * Customer has paid, booking becomes
 * dispatch-ready for provider matching.
 */
const PAYMENT_SUCCESS_STATUS: BookingStatus = "matched";

export async function POST(req: NextRequest) {
  try {
    const body: CapturePayload = await req.json();

    const { orderID, booking_id } = body;

    /**
     * Validate request
     */
    if (!orderID || !booking_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderID, booking_id",
        },
        { status: 400 },
      );
    }

    /**
     * 1. Capture PayPal order
     */
    const capture = await capturePayPalOrder(orderID);

    const captureStatus =
      capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status ??
      capture?.status;

    if (captureStatus !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment capture not completed",
          paypal_status: captureStatus ?? "UNKNOWN",
        },
        { status: 400 },
      );
    }

    /**
     * 2. Get booking
     */
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, status, payment_status")
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
     * Prevent duplicate payment processing
     */
    if (booking.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        already_paid: true,
        booking,
      });
    }

    /**
     * 3. Validate booking transition
     *
     * Example:
     * pending → matched ✅
     * cancelled → matched ❌
     */
    if (
      currentStatus !== PAYMENT_SUCCESS_STATUS &&
      !canTransition(currentStatus, PAYMENT_SUCCESS_STATUS)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid booking transition: ${currentStatus} → ${PAYMENT_SUCCESS_STATUS}`,
        },
        { status: 409 },
      );
    }

    /**
     * 4. Update booking
     */
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: PAYMENT_SUCCESS_STATUS,
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

    /**
     * 5. Success response
     */
    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      payment_status: "paid",
      transitioned_to: PAYMENT_SUCCESS_STATUS,
      paypal_capture_id:
        capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null,
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
