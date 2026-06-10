"use client";

import DispatchCockpit from "@/components/dispatch/DispatchCockpit";
import LiveDispatchMap from "@/components/dispatch/LiveDispatchMap";

/**
 * ==========================================
 * SAFE DRIVE LIVE DISPATCH (COCKPIT MODE)
 * ==========================================
 */

export default function LiveDispatchPage() {
  return <DispatchCockpit map={<LiveDispatchMap />} />;
}
