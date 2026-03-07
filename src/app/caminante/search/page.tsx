import Link from "next/link";
import { searchPublishedListings } from "@/lib/listings/queries";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: "activity" | "transport" | "accommodation" | "package";
    destination?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, destination } = await searchParams;
  const listings = await searchPublishedListings({ q, type, destination, limit: 30 });

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold">Buscar experiencias</h2>
      <form className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-4">
        <input
          className="rounded-lg border border-stone-300 px-3 py-2"
          name="q"
          defaultValue={q}
          placeholder="Qué quieres hacer"
        />
        <select className="rounded-lg border border-stone-300 px-3 py-2" name="type" defaultValue={type}>
          <option value="">Todos los tipos</option>
          <option value="activity">Actividad</option>
          <option value="transport">Transporte</option>
          <option value="accommodation">Hospedaje</option>
          <option value="package">Paquete</option>
        </select>
        <input
          className="rounded-lg border border-stone-300 px-3 py-2"
          name="destination"
          defaultValue={destination}
          placeholder="Destino"
        />
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">
          Buscar
        </button>
      </form>
      <p className="text-sm text-stone-600">{listings.length} resultados</p>
      <div className="grid gap-3">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/caminante/listings/${listing.id}`}
            className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{listing.title}</h3>
              <span className="rounded-full bg-stone-100 px-2 py-1 text-xs uppercase">{listing.type}</span>
            </div>
            <p className="text-sm text-stone-600">
              {listing.destination ?? "Sin destino"} · vibe {listing.vibe ?? "n/a"} · dificultad{" "}
              {listing.difficulty ?? "n/a"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
