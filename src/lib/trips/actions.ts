"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function toNullableDate(raw: string) {
  if (!raw) {
    return null;
  }
  return raw;
}

export async function createTripAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/caminante/login?next=/caminante/trips/new");
  }

  const title = requireString(formData, "title");
  const destination = requireString(formData, "destination");
  const startDate = toNullableDate(requireString(formData, "start_date"));
  const endDate = toNullableDate(requireString(formData, "end_date"));

  if (!title) {
    redirect("/caminante/trips/new?error=title_required");
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_user_id: user.id,
      title,
      destination: destination || null,
      start_date: startDate,
      end_date: endDate,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    redirect(`/caminante/trips/new?error=${encodeURIComponent(error?.message ?? "create_failed")}`);
  }

  redirect(`/caminante/trips/${data.id}`);
}

export async function addTripItemAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tripId = requireString(formData, "trip_id");
  const listingId = requireString(formData, "listing_id");
  const bookingMode = requireString(formData, "booking_mode") || "instant";
  const quantityRaw = Number(requireString(formData, "quantity") || "1");
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1;
  const priceRaw = Number(requireString(formData, "price_mxn") || "0");
  const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0;

  if (!user) {
    redirect(`/caminante/login?next=/caminante/trips/${tripId}`);
  }

  if (!tripId || !listingId) {
    redirect(`/caminante/trips/${tripId}?error=missing_fields`);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id,status")
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();

  if (!listing) {
    redirect(`/caminante/trips/${tripId}?error=listing_not_available`);
  }

  const { error } = await supabase.from("trip_items").insert({
    trip_id: tripId,
    listing_id: listingId,
    booking_mode: bookingMode,
    quantity,
    price_mxn: price,
    status: "draft",
  });

  if (error) {
    redirect(`/caminante/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/caminante/trips/${tripId}?added=1`);
}

export async function submitRequestBookingsAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tripId = requireString(formData, "trip_id");

  if (!user) {
    redirect(`/caminante/login?next=/caminante/trips/${tripId}`);
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id,owner_user_id")
    .eq("id", tripId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!trip) {
    redirect("/caminante?error=trip_not_found");
  }

  const { data: requestItems } = await supabase
    .from("trip_items")
    .select("id,listing_id,booking_mode")
    .eq("trip_id", tripId)
    .eq("booking_mode", "request");

  if (!requestItems || requestItems.length === 0) {
    redirect(`/caminante/trips/${tripId}?error=no_request_items`);
  }

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("trip_item_id")
    .in(
      "trip_item_id",
      requestItems.map((item) => item.id),
    );
  const existingSet = new Set((existingBookings ?? []).map((b) => b.trip_item_id));

  const listingIds = requestItems.map((item) => item.listing_id);
  const { data: listingProviders } = await supabase
    .from("listings")
    .select("id,provider_id")
    .in("id", listingIds);
  const providerMap = new Map((listingProviders ?? []).map((l) => [l.id, l.provider_id]));

  const deadline = new Date();
  deadline.setHours(23, 59, 59, 999);

  for (const item of requestItems) {
    if (existingSet.has(item.id)) {
      continue;
    }

    const providerId = providerMap.get(item.listing_id);
    if (!providerId) {
      continue;
    }

    const { error } = await supabase.from("bookings").insert({
      trip_item_id: item.id,
      provider_id: providerId,
      status: "pending_request",
      confirmation_deadline_at: deadline.toISOString(),
    });

    if (error && !error.message.toLowerCase().includes("duplicate key")) {
      redirect(`/caminante/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect(`/caminante/trips/${tripId}?requests_submitted=1`);
}
