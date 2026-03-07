import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fromStripeAmount } from "@/lib/payments/stripe";

export interface FinalizeResult {
  tripId: string;
  paymentIntentId: string;
  confirmedBookings: number;
  paymentRecorded: boolean;
}

export async function finalizeSucceededPaymentIntent(
  intent: Stripe.PaymentIntent,
): Promise<FinalizeResult> {
  if (intent.status !== "succeeded") {
    throw new Error(`Payment intent not succeeded: ${intent.status}`);
  }

  const tripId = intent.metadata.trip_id;
  const userId = intent.metadata.user_id;

  if (!tripId || !userId) {
    throw new Error("Missing trip_id or user_id metadata in payment intent");
  }

  const supabase = createSupabaseAdminClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id,owner_user_id")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) {
    throw new Error("Trip not found for payment intent");
  }

  if (trip.owner_user_id !== userId) {
    throw new Error("Payment metadata user_id does not match trip owner");
  }

  const paidMxn = fromStripeAmount(intent.amount_received || intent.amount || 0);
  if (paidMxn <= 0) {
    throw new Error("Invalid amount received");
  }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("provider_ref", intent.id)
    .maybeSingle();

  let paymentRecorded = false;
  if (!existingPayment) {
    const { error: paymentError } = await supabase.from("payments").insert({
      trip_id: tripId,
      payer_user_id: userId,
      amount_mxn: paidMxn,
      status: "paid",
      provider_ref: intent.id,
      paid_at: new Date().toISOString(),
    });

    if (paymentError && !paymentError.message.toLowerCase().includes("duplicate key")) {
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    if (!paymentError) {
      paymentRecorded = true;
    }
  }

  const { data: tripItems, error: tripItemsError } = await supabase
    .from("trip_items")
    .select("id,listing_id")
    .eq("trip_id", tripId)
    .eq("booking_mode", "instant");

  if (tripItemsError) {
    throw new Error(`Failed to load trip items: ${tripItemsError.message}`);
  }

  const itemIds = (tripItems ?? []).map((item) => item.id);
  const listingIds = (tripItems ?? []).map((item) => item.listing_id);

  const { data: existingBookings } = itemIds.length
    ? await supabase
        .from("bookings")
        .select("trip_item_id")
        .in("trip_item_id", itemIds)
    : { data: [] as Array<{ trip_item_id: string }> };

  const existingSet = new Set((existingBookings ?? []).map((row) => row.trip_item_id));

  const { data: listings } = listingIds.length
    ? await supabase
        .from("listings")
        .select("id,provider_id")
        .in("id", listingIds)
    : { data: [] as Array<{ id: string; provider_id: string }> };

  const providerMap = new Map((listings ?? []).map((row) => [row.id, row.provider_id]));

  let confirmedBookings = 0;
  for (const item of tripItems ?? []) {
    if (existingSet.has(item.id)) {
      continue;
    }

    const providerId = providerMap.get(item.listing_id);
    if (!providerId) {
      continue;
    }

    const { error: bookingError } = await supabase.from("bookings").insert({
      trip_item_id: item.id,
      provider_id: providerId,
      status: "confirmed",
      confirmation_deadline_at: null,
    });

    if (bookingError && !bookingError.message.toLowerCase().includes("duplicate key")) {
      throw new Error(`Failed creating booking for item ${item.id}: ${bookingError.message}`);
    }

    if (!bookingError) {
      confirmedBookings += 1;
    }
  }

  return {
    tripId,
    paymentIntentId: intent.id,
    confirmedBookings,
    paymentRecorded,
  };
}
