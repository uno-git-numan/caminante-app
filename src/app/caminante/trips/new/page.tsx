import Image from "next/image";
import { createTripAction } from "@/lib/trips/actions";

interface NewTripPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewTripPage({ searchParams }: NewTripPageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Left: photo */}
      <div className="relative hidden w-1/2 md:block">
        <Image
          src="/images/trips.jpeg"
          alt="Viaje"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Caminante</p>
          <h2 className="mt-2 text-3xl font-light">Cada viaje<br />empieza aquí.</h2>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col justify-center px-10 py-16 md:w-1/2">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Nuevo viaje</p>
            <h2 className="mt-2 text-2xl font-light">Crear viaje</h2>
            <p className="mt-2 text-sm text-stone-400">Después puedes agregar actividades, hospedaje y transporte.</p>
          </div>

          {error ? (
            <div className="border-l-2 border-rose-400 pl-4 text-sm text-stone-600">
              {decodeURIComponent(error)}
            </div>
          ) : null}

          <form action={createTripAction} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-stone-400">Nombre del viaje</label>
              <input
                className="w-full border-b border-stone-300 bg-transparent py-2 text-sm outline-none focus:border-stone-900"
                name="title"
                placeholder="p. ej. Barrancas del Cobre"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-stone-400">Destino</label>
              <input
                className="w-full border-b border-stone-300 bg-transparent py-2 text-sm outline-none focus:border-stone-900"
                name="destination"
                placeholder="p. ej. Chihuahua"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest text-stone-400">Inicio</label>
                <input
                  className="w-full border-b border-stone-300 bg-transparent py-2 text-sm outline-none focus:border-stone-900"
                  name="start_date"
                  type="date"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest text-stone-400">Fin</label>
                <input
                  className="w-full border-b border-stone-300 bg-transparent py-2 text-sm outline-none focus:border-stone-900"
                  name="end_date"
                  type="date"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full border border-stone-900 py-3 text-sm tracking-widest transition-colors hover:bg-stone-900 hover:text-white"
            >
              Crear viaje
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
