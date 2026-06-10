import { dispatchAICore } from "./dispatchAICore";

/**
 * =========================
 * DISPATCH AI SINGLETON BOOTSTRAP
 * =========================
 *
 * Ensures AI loop starts ONLY ONCE:
 * - Prevents Fast Refresh duplication
 * - Prevents Vercel multi-instance accidental starts
 * - Prevents double dispatch engines
 */

declare global {
  // eslint-disable-next-line no-var
  var __dispatch_ai_started__: boolean | undefined;
}

export function initDispatchAI(): void {
  if (globalThis.__dispatch_ai_started__) {
    return;
  }

  globalThis.__dispatch_ai_started__ = true;

  console.log("🚀 Dispatch AI Core starting...");

  try {
    dispatchAICore.start();
  } catch (err) {
    console.error("❌ Failed to start Dispatch AI Core:", err);

    // allow retry if startup failed
    globalThis.__dispatch_ai_started__ = false;
  }
}
