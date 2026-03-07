import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addTripItemAction, submitRequestBookingsAction } from "@/lib/trips/actions";

interface TripPageProps {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string; added?: string; requests_submitted?: string }>;
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { tripId } = await params;
  const { error, added, requests_submitted: requestsSubmitted } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("id,title,destination,start_date,end_date,status")
    .eq("id", tripId)
    .maybeSingle();

  const { data: tripItems } = await supabase
    .from("trip_items")
    .select("id,listing_id,booking_mode,quantity,price_mxn,status,created_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  const { data: listings } = await supabase
    .from("listings")
    .select("id,title,type,destination")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!trip) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Trip no encontrado</h2>
        <p className="text-stone-600">Verifica acceso y el identificador del viaje.</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-2xl font-semibold">{trip.title}</h2>
        <p className="text-stone-600">
          {trip.destination ?? "Sin destino"} · {trip.start_date ?? "sin fecha"} a {trip.end_date ?? "sin fecha"} ·{" "}
          {trip.status}
        </p>
        <Link className="text-sm text-emerald-700 hover:underline" href={`/caminante/trips/${tripId}/hub`}>
          Ir al Trip Hub
        </Link>
      </div>

      {added === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Item agregado al viaje.</p>
      ) : null}
      {requestsSubmitted === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Requests enviados a operadores (SLA mismo dia).
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/caminante/trips/${tripId}/checkout`}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Ir a checkout (instant)
        </Link>
        <form action={submitRequestBookingsAction}>
          <input type="hidden" name="trip_id" value={tripId} />
          <button
            type="submit"
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:border-emerald-700"
          >
            Enviar request-to-book
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form action={addTripItemAction} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold">Agregar item</h3>
          <input type="hidden" name="trip_id" value={tripId} />
          <label className="space-y-1 text-sm">
            <span>Listing</span>
            <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="listing_id" required>
              <option value="">Selecciona un listing publicado</option>
              {listings?.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title} ({listing.type}) - {listing.destination ?? "N/A"}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Modo de booking</span>
            <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="booking_mode" defaultValue="instant">
              <option value="instant">instant</option>
              <option value="request">request</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Cantidad</span>
            <input className="w-full rounded-lg border border-stone-300 px-3 py-2" name="quantity" type="number" min={1} defaultValue={1} />
          </label>
          <label className="space-y-1 text-sm">
            <span>Precio MXN (placeholder)</span>
            <input
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              name="price_mxn"
              type="number"
              min={0}
              step="0.01"
              defaultValue={0}
            />
          </label>
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
            Agregar item
          </button>
        </form>

        <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="font-semibold">Items del viaje</h3>
          {tripItems && tripItems.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {tripItems.map((item) => (
                <li key={item.id} className="rounded-lg border border-stone-200 p-3">
                  <p>
                    listing: <span className="font-mono text-xs">{item.listing_id}</span>
                  </p>
                  <p>
                    mode: {item.booking_mode} · qty: {item.quantity} · MXN {item.price_mxn}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-600">No hay items aún.</p>
          )}
        </div>
      </div>
    </section>
  );
}
