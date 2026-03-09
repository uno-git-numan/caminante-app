import Link from "next/link";
import Image from "next/image";
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
    <div>
      {/* Photo header */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        <Image
          src="/images/search.jpeg"
          alt="Explorar"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Descubre</p>
          <h2 className="mt-2 text-3xl font-light tracking-wide">Experiencias</h2>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Search form */}
        <form className="grid gap-3 md:grid-cols-4">
          <input
            className="border-b border-stone-300 bg-transparent px-0 py-2 text-sm placeholder-stone-400 outline-none focus:border-stone-900"
            name="q"
            defaultValue={q}
            placeholder="¿Qué quieres hacer?"
          />
          <select
            className="border-b border-stone-300 bg-transparent px-0 py-2 text-sm text-stone-600 outline-none focus:border-stone-900"
            name="type"
            defaultValue={type}
          >
            <option value="">Todos los tipos</option>
            <option value="activity">Actividad</option>
            <option value="transport">Transporte</option>
            <option value="accommodation">Hospedaje</option>
            <option value="package">Paquete</option>
          </select>
          <input
            className="border-b border-stone-300 bg-transparent px-0 py-2 text-sm placeholder-stone-400 outline-none focus:border-stone-900"
            name="destination"
            defaultValue={destination}
            placeholder="Destino"
          />
          <button
            type="submit"
            className="border border-stone-900 px-6 py-2 text-sm tracking-widest transition-colors hover:bg-stone-900 hover:text-white"
          >
            Buscar
          </button>
        </form>

        {/* Results */}
        <p className="text-xs uppercase tracking-widest text-stone-400">{listings.length} resultados</p>
        <div className="divide-y divide-stone-100">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/caminante/listings/${listing.id}`}
              className="flex items-center justify-between py-5 transition-colors hover:text-emerald-700"
            >
              <div>
                <h3 className="text-base font-light">{listing.title}</h3>
                <p className="mt-1 text-xs text-stone-400">
                  {listing.destination ?? "Sin destino"} · {listing.vibe ?? "—"} · {listing.difficulty ?? "—"}
                </p>
              </div>
              <span className="text-xs uppercase tracking-widest text-stone-400">{listing.type}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
