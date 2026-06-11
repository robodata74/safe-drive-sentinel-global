import paypal from "@paypal/checkout-server-sdk";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const PAYPAL_ENV = process.env.NEXT_PUBLIC_PAYPAL_ENV ?? "sandbox";

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID environment variable");
}

if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET environment variable");
}

/**
 * PayPal Environment
 */
const environment =
  PAYPAL_ENV === "live"
    ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(
        PAYPAL_CLIENT_ID,
        PAYPAL_CLIENT_SECRET,
      );

/**
 * Shared PayPal client
 */
export const paypalClient = new paypal.core.PayPalHttpClient(environment);

/**
 * Create PayPal order
 */
export async function createPayPalOrder(amount: number, currency = "USD") {
  const request = new paypal.orders.OrdersCreateRequest();

  request.prefer("return=representation");

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      },
    ],
  });

  const response = await paypalClient.execute(request);

  return response.result;
}

/**
 * Capture completed payment
 */
export async function capturePayPalOrder(orderID: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderID);

  request.requestBody({});

  const response = await paypalClient.execute(request);

  return response.result;
}
