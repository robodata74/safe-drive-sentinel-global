"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function TestPayPalPage() {
  const clientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1120",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>💳 SafeDrive PayPal Diagnostic</h1>

      <p>
        Environment:{" "}
        <strong>
          {process.env.NEXT_PUBLIC_PAYPAL_ENV}
        </strong>
      </p>

      <p>
        Client ID Loaded:{" "}
        <strong>
          {clientId ? "✅ YES" : "❌ NO"}
        </strong>
      </p>

      <div
        style={{
          maxWidth: 420,
          marginTop: 30,
          background: "#111827",
          padding: 20,
          borderRadius: 12,
        }}
      >
        <h2>Sandbox Test Payment</h2>

        <PayPalScriptProvider
          options={{
            clientId,
            currency: "USD",
            intent: "capture",
          }}
        >
          <PayPalButtons
            style={{
              layout: "vertical",
            }}
            createOrder={(_, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [
                  {
                    amount: {
                      currency_code: "USD",
                      value: "10.00",
                    },
                    description:
                      "SafeDrive Sentinel Sandbox Test",
                  },
                ],
              });
            }}
            onApprove={async (_, actions) => {
              const details =
                await actions.order?.capture();

              console.log(
                "PAYMENT SUCCESS:",
                details
              );

              alert(
                "Sandbox Payment Successful ✅"
              );
            }}
            onError={(err) => {
              console.error(
                "PAYPAL ERROR:",
                err
              );

              alert("Payment failed ❌");
            }}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
}