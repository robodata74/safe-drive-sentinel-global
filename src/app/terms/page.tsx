"use client";

import { useState } from "react";

export default function TermsPage() {
  const [accepted, setAccepted] = useState(false);

  const acceptTerms = async () => {
    await fetch("/api/terms/accept", {
      method: "POST",
      body: JSON.stringify({
        userId: "current-user-id",
        role: "driver",
      }),
    });

    setAccepted(true);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Terms & Conditions</h1>

      <p>
        By using SafeDrive Sentinel you agree to all legal terms, liability
        rules, and platform policies.
      </p>

      <label>
        <input
          type="checkbox"
          onChange={(e) => setAccepted(e.target.checked)}
        />
        I accept Terms & Conditions
      </label>

      <br />

      <button disabled={!accepted} onClick={acceptTerms}>
        Accept & Continue
      </button>
    </div>
  );
}
