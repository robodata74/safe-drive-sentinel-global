import { DispatchEngine } from "@/lib/dispatch/dispatchEngine";
import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import { termsGuard } from "@/lib/legal/termsGuard";

/**
 * =========================
 * DISPATCH AI CORE (GLOBAL PRODUCTION)
 * =========================
 * - stable matching engine
 * - fairness-aware scoring
 * - legal enforcement layer
 * - race-condition safe
 * - payout-safe dispatch logic
 */

type Match = {
  bookingId: string;
  driverId: string;
  score: number;
};

class DispatchAICore {
  private interval: NodeJS.Timeout | null = null;
  private running = false;

  /**
   * cooldown locks prevent:
   * - double booking assignment
   * - spam reassignment
   */
  private cooldown = new Map<string, number>();

  private readonly TICK_MS = 3000;
  private readonly MIN_SCORE = 35;

  private readonly DEBUG = true;

  /**
   * =========================
   * START ENGINE
   * =========================
   */
  start(): void {
    if (this.running) return;

    this.running = true;

    console.log("🤖 DISPATCH AI CORE STARTED (GLOBAL MODE)");

    this.interval = setInterval(() => {
      try {
        this.tick();
      } catch (err) {
        console.error("❌ DISPATCH AI CRASH PROTECTED:", err);
      }
    }, this.TICK_MS);
  }

  /**
   * =========================
   * STOP ENGINE
   * =========================
   */
  stop(): void {
    if (this.interval) clearInterval(this.interval);

    this.interval = null;
    this.running = false;

    console.log("🛑 DISPATCH AI CORE STOPPED");
  }

  /**
   * =========================
   * COOLDOWN SYSTEM
   * =========================
   */
  private isCooling(key: string, duration = 10000): boolean {
    const now = Date.now();
    const last = this.cooldown.get(key) ?? 0;

    if (now - last < duration) return true;

    this.cooldown.set(key, now);
    return false;
  }

  /**
   * =========================
   * LEGAL GATE
   * =========================
   * Blocks drivers who haven't accepted terms
   */
  private isDriverEligible(driverId: string): boolean {
    return termsGuard.hasAccepted(driverId);
  }

  /**
   * =========================
   * SAFE SNAPSHOT
   * =========================
   */
  private getSafeSnapshot() {
    const snapshot = dispatchStore.getSnapshot();

    return {
      drivers: snapshot.drivers ?? [],
      bookings: snapshot.bookings ?? [],
    };
  }

  /**
   * =========================
   * SCORING ENGINE
   * =========================
   */
  private scoreDriver(driver: any, booking: any): number {
    return DispatchEngine.score(driver, booking);
  }

  /**
   * =========================
   * MAIN AI LOOP
   * =========================
   */
  private tick(): void {
    const { drivers, bookings } = this.getSafeSnapshot();

    const pending = bookings.filter((b) => b.status === "pending");
    const available = drivers.filter((d) => d.status === "available");

    if (!pending.length || !available.length) return;

    const matches: Match[] = [];

    /**
     * =========================
     * MATCHING ENGINE
     * =========================
     */
    for (const booking of pending) {
      let best: Match | null = null;

      for (const driver of available) {
        /**
         * =========================
         * LEGAL ENFORCEMENT CHECK
         * =========================
         */
        if (!this.isDriverEligible(driver.id)) {
          if (this.DEBUG) {
            console.warn("🚫 DRIVER BLOCKED (NO TERMS):", driver.id);
          }
          continue;
        }

        const score = this.scoreDriver(driver, booking);

        if (score < this.MIN_SCORE) continue;

        /**
         * DRIVER LOCK
         */
        if (this.isCooling(`driver:${driver.id}`)) continue;

        /**
         * BOOKING LOCK
         */
        if (this.isCooling(`booking:${booking.id}`)) continue;

        /**
         * FAIRNESS BOOST
         */
        const idleTime = driver.lastSeen ? Date.now() - driver.lastSeen : 0;

        const fairnessBoost = idleTime > 60000 ? 5 : 0;

        const finalScore = score + fairnessBoost;

        if (!best || finalScore > best.score) {
          best = {
            bookingId: booking.id,
            driverId: driver.id,
            score: finalScore,
          };
        }
      }

      if (best) {
        matches.push(best);
      }
    }

    /**
     * =========================
     * APPLY MATCHES SAFELY
     * =========================
     */
    for (const match of matches) {
      const driverKey = `driver:${match.driverId}`;
      const bookingKey = `booking:${match.bookingId}`;

      if (this.isCooling(driverKey)) continue;
      if (this.isCooling(bookingKey)) continue;

      /**
       * FINAL LEGAL CHECK BEFORE ASSIGNMENT
       */
      if (!this.isDriverEligible(match.driverId)) continue;

      dispatchStore.assignDriver(match.bookingId, match.driverId);

      this.isCooling(driverKey);
      this.isCooling(bookingKey);
    }

    if (matches.length > 0 && this.DEBUG) {
      console.log(`🚀 AI MATCHED: ${matches.length} BOOKINGS`);
    }
  }

  /**
   * =========================
   * MANUAL TRIGGER
   * =========================
   */
  trigger(): void {
    this.tick();
  }

  /**
   * =========================
   * STATUS
   * =========================
   */
  isRunning(): boolean {
    return this.running;
  }
}

/**
 * =========================
 * SINGLETON EXPORT
 * =========================
 */
export const dispatchAICore = new DispatchAICore();
