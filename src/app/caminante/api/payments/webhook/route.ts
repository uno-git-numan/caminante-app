import { NextResponse } from "next/server";
import Stripe from "stripe";
import { finalizeSucceededPaymentIntent } from "@/lib/payments/finalize";
import { getStripeServerClient } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" },
      { status: 400 },
    );
  }

  const payload = await request.text();
  const stripe = getStripeServerClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(error as Error).message}` },
      { status: 400 },
    );
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await finalizeSucceededPaymentIntent(event.data.object as Stripe.PaymentIntent);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook processing failed: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
