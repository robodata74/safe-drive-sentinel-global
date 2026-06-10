import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import { paypalPayoutEngine } from "@/lib/payments/paypalPayoutEngine";

/**
 * =========================================================
 * SAFE DRIVE ADMIN ENGINE (COMMAND CENTER BACKEND)
 * =========================================================
 */

class AdminEngine {
  /**
   * LIVE SNAPSHOT (REAL-TIME SYSTEM STATE)
   */
  getSystemSnapshot() {
    const snapshot = dispatchStore.getSnapshot();

    return {
      drivers: snapshot.drivers,
      bookings: snapshot.bookings,

      metrics: {
        totalDrivers: snapshot.drivers.length,
        activeDrivers: snapshot.drivers.filter((d) => d.status === "available")
          .length,
        pendingBookings: snapshot.bookings.filter((b) => b.status === "pending")
          .length,
        completedBookings: snapshot.bookings.filter(
          (b) => b.status === "completed",
        ).length,
      },
    };
  }

  /**
   * PAYOUT OVERVIEW
   */
  getPayoutStatus() {
    return paypalPayoutEngine.getPayoutSummary();
  }

  /**
   * LEGAL VIOLATIONS FEED
   */
  getLegalStatus() {
    return {
      active: true,
      note: "All violations are review-based. No auto punishment system.",
    };
  }

  /**
   * FORCE DISPATCH REFRESH
   */
  triggerRebalance() {
    console.log("⚡ ADMIN TRIGGER: DISPATCH RECALCULATING");
  }

  /**
   * EMERGENCY STOP SYSTEM (GLOBAL SAFETY SWITCH)
   */
  emergencyStop() {
    console.log("🛑 EMERGENCY STOP ACTIVATED");

    dispatchStore.getSnapshot().drivers.forEach((d) => {
      dispatchStore.addOrUpdateDriver({
        ...d,
        status: "offline",
      });
    });
  }
}

export const adminEngine = new AdminEngine();
