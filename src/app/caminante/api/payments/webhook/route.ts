import { NextResponse } from "next/server";
import Stripe from "stripe";
import { finalizeSucceededPaymentIntent } from "@/lib/payments/finalize";
import { finalizeReservationCheckout } from "@/lib/payments/finalize-reservation";
import { finalizeSelfServeCheckout } from "@/lib/payments/finalize-selfserve";
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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // (1) Cobro por WhatsApp: reserva YA creada por admin (metadata.reservation_id).
      const res = await finalizeReservationCheckout(session);
      // (2) Pago directo en web (self-serve): NO hay reserva previa (metadata.self_serve).
      //     Crea contacto + reserva PAGADA + pago, atribuida al operador.
      if (!res.handled) {
        await finalizeSelfServeCheckout(session);
      }
    } else if (event.type === "payment_intent.succeeded") {
      // Camino marketplace DORMIDO (trips/bookings): solo corre si el intent trae trip_id.
      // Los PaymentIntents de los Payment Links no lo traen → se ignoran aquí (su pago se
      // procesa en checkout.session.completed) para no reventar el webhook.
      const intent = event.data.object as Stripe.PaymentIntent;
      if (intent.metadata?.trip_id) {
        await finalizeSucceededPaymentIntent(intent);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook processing failed: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
