import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PayableTripItem {
  id: string;
  trip_id: string;
  listing_id: string;
  quantity: number;
  price_mxn: number;
  booking_mode: "instant" | "request";
}

export async function getOwnedTripById(tripId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { trip: null, user: null };
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id,title,destination,start_date,end_date,status,owner_user_id")
    .eq("id", tripId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  return { trip, user };
}

export async function getTripItemsForCheckout(tripId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: tripItems, error } = await supabase
    .from("trip_items")
    .select("id,trip_id,listing_id,quantity,price_mxn,booking_mode")
    .eq("trip_id", tripId)
    .in("booking_mode", ["instant", "request"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const tripItemIds = (tripItems ?? []).map((item) => item.id);
  const { data: existingBookings } = tripItemIds.length
    ? await supabase
        .from("bookings")
        .select("trip_item_id,status")
        .in("trip_item_id", tripItemIds)
    : { data: [] as Array<{ trip_item_id: string; status: string }> };

  const bookedMap = new Map((existingBookings ?? []).map((b) => [b.trip_item_id, b.status]));

  const payable = (tripItems ?? []).filter(
    (item) => item.booking_mode === "instant" && !bookedMap.has(item.id),
  ) as PayableTripItem[];

  const requestOnly = (tripItems ?? []).filter(
    (item) => item.booking_mode === "request" && !bookedMap.has(item.id),
  ) as PayableTripItem[];

  const payableTotalMxn = payable.reduce(
    (acc, item) => acc + Number(item.price_mxn) * item.quantity,
    0,
  );

  return { payable, requestOnly, payableTotalMxn };
}
