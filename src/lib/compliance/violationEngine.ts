import { notificationBus } from "@/lib/notifications/notificationBus";

export type ViolationType =
  | "gps_spoofing"
  | "fraudulent_activity"
  | "no_terms_acceptance"
  | "illegal_use";

class ViolationEngine {
  private violations = new Map<string, number>();

  /**
   * =========================
   * REPORT VIOLATION
   * =========================
   */
  report(userId: string, type: ViolationType) {
    const count = this.violations.get(userId) ?? 0;
    const newCount = count + 1;

    this.violations.set(userId, newCount);

    /**
     * =========================
     * AI DECISION LAYER (RULE BASED)
     * =========================
     */
    if (newCount === 1) {
      notificationBus.send({
        id: `${userId}-warn-1`,
        userId,
        type: "warning",
        title: "Policy Warning",
        message: `Violation detected: ${type}. This is your first warning.`,
        timestamp: Date.now(),
      });
    }

    if (newCount === 2) {
      notificationBus.send({
        id: `${userId}-warn-2`,
        userId,
        type: "payout_hold",
        title: "Account Restricted",
        message: "Your payouts have been temporarily held pending review.",
        timestamp: Date.now(),
      });
    }

    if (newCount >= 3) {
      notificationBus.send({
        id: `${userId}-ban`,
        userId,
        type: "suspension",
        title: "Account Suspended",
        message: "Your account has been suspended due to repeated violations.",
        timestamp: Date.now(),
      });
    }

    console.warn(`⚠️ VIOLATION: ${userId} → ${type}`);
  }

  /**
   * RESET (admin use)
   */
  reset(userId: string) {
    this.violations.delete(userId);
  }
}

export const violationEngine = new ViolationEngine();
