import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function toStripeAmount(amountMxn: number) {
  return Math.round(amountMxn * 100);
}

export function fromStripeAmount(amountCents: number) {
  return amountCents / 100;
}
