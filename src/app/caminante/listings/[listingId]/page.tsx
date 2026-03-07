interface ListingPageProps {
  params: Promise<{ listingId: string }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { listingId } = await params;
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .select("id,title,description,type,destination,vibe,difficulty,status,updated_at")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !listing) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Listing no encontrado</h2>
        <p className="text-stone-600">Verifica que esté publicado y que el ID sea correcto.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">{listing.title}</h2>
      <p className="text-stone-600">
        {listing.type} · {listing.destination ?? "Sin destino"} · vibe {listing.vibe ?? "n/a"} · dificultad{" "}
        {listing.difficulty ?? "n/a"}
      </p>
      <p className="rounded-xl border border-stone-200 bg-white p-4 text-stone-700">
        {listing.description ?? "Sin descripción"}
      </p>
      <p className="text-xs text-stone-500">Listing ID: {listing.id}</p>
    </section>
  );
}
