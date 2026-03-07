import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { finalizeSucceededPaymentIntent } from "@/lib/payments/finalize";
import { getStripeServerClient } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paymentIntentId = typeof body?.paymentIntentId === "string" ? body.paymentIntentId : "";
  const tripId = typeof body?.tripId === "string" ? body.tripId : "";

  if (!paymentIntentId || !tripId) {
    return NextResponse.json(
      { error: "Missing paymentIntentId or tripId" },
      { status: 400 },
    );
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id,owner_user_id")
    .eq("id", tripId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const stripe = getStripeServerClient();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (intent.status !== "succeeded") {
    return NextResponse.json(
      { error: `Payment intent not succeeded (status=${intent.status})` },
      { status: 400 },
    );
  }

  if (intent.metadata.trip_id !== tripId || intent.metadata.user_id !== user.id) {
    return NextResponse.json({ error: "Payment metadata mismatch" }, { status: 400 });
  }

  const result = await finalizeSucceededPaymentIntent(intent);

  return NextResponse.json(
    {
      ok: true,
      ...result,
    },
    { status: 200 },
  );
}
