import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ListingSearchFilters {
  q?: string;
  type?: "activity" | "transport" | "accommodation" | "package";
  destination?: string;
  limit?: number;
}

export async function searchPublishedListings(filters: ListingSearchFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);

  let query = supabase
    .from("listings")
    .select("id,title,type,destination,vibe,difficulty,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,destination.ilike.%${filters.q}%`,
    );
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.destination) {
    query = query.ilike("destination", `%${filters.destination}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("searchPublishedListings error:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getListingsByIds(listingIds: string[]) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .select("id,title,type,destination,vibe,difficulty,status")
    .in("id", listingIds)
    .limit(20);

  if (error) {
    console.error("getListingsByIds error:", error.message);
    return [];
  }

  return data ?? [];
}
