"use client";

import LiveDispatchMap from "@/components/dispatch/LiveDispatchMap";

export default function LiveDispatchPage() {
  return (
    <main
      style={{
        padding: 20,
      }}
    >
      <h1>🚛 SafeDrive Live Dispatch</h1>

      <LiveDispatchMap />
    </main>
  );
}
