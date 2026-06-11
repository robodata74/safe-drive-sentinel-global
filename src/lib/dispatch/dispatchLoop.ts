import { DispatchEngine } from "./dispatchEngine";
import { dispatchStore } from "./dispatchStore";

let loopRunning = false;
let interval: NodeJS.Timeout | null = null;

/**
 * =========================
 * REALTIME DISPATCH LOOP
 * =========================
 */
export function startDispatchLoop(intervalMs = 3000): void {
  if (loopRunning) return;

  loopRunning = true;

  interval = setInterval(() => {
    runLoop();
  }, intervalMs);

  console.log("🧠 Dispatch AI Loop STARTED");
}

/**
 * =========================
 * STOP LOOP
 * =========================
 */
export function stopDispatchLoop(): void {
  if (interval) clearInterval(interval);

  loopRunning = false;
  interval = null;

  console.log("🛑 Dispatch AI Loop STOPPED");
}

/**
 * =========================
 * CORE LOOP LOGIC
 * =========================
 */
function runLoop(): void {
  const snapshot = dispatchStore.getSnapshot();

  const drivers = snapshot.drivers;
  const bookings = snapshot.bookings;

  const pendingBookings = bookings.filter((b) => b.status === "pending");

  const availableDrivers = drivers.filter((d) => d.status === "available");

  /**
   * No work needed
   */
  if (!pendingBookings.length || !availableDrivers.length) {
    return;
  }

  /**
   * =========================
   * AI MATCH EVALUATION
   * =========================
   */
  for (const booking of pendingBookings) {
    let bestScore = -Infinity;
    let bestDriverId: string | null = null;

    for (const driver of availableDrivers) {
      const score = DispatchEngine.score(driver, booking);

      if (score > bestScore) {
        bestScore = score;
        bestDriverId = driver.id;
      }
    }

    /**
     * =========================
     * AUTO ASSIGN BEST DRIVER
     * =========================
     */
    if (bestDriverId) {
      dispatchStore.assignDriver(booking.id, bestDriverId);
    }
  }
}
