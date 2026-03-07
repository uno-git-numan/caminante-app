import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTripItemsForCheckout } from "@/lib/payments/queries";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tripId = typeof body?.tripId === "string" ? body.tripId : "";

  if (!tripId) {
    return NextResponse.json({ error: "Missing tripId" }, { status: 400 });
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

  const { payable, payableTotalMxn } = await getTripItemsForCheckout(tripId);

  if (payable.length === 0 || payableTotalMxn <= 0) {
    return NextResponse.json(
      { error: "No payable instant items in this trip" },
      { status: 400 },
    );
  }

  const stripe = getStripeServerClient();
  const intent = await stripe.paymentIntents.create({
    amount: toStripeAmount(payableTotalMxn),
    currency: "mxn",
    automatic_payment_methods: { enabled: true },
    metadata: {
      trip_id: tripId,
      user_id: user.id,
      flow: "single_payer_instant_items",
    },
  });

  if (!intent.client_secret) {
    return NextResponse.json(
      { error: "Failed to create payment intent client secret" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountMxn: payableTotalMxn,
      payableCount: payable.length,
    },
    { status: 200 },
  );
}
