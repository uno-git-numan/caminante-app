import { createTripAction } from "@/lib/trips/actions";

interface NewTripPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewTripPage({ searchParams }: NewTripPageProps) {
  const { error } = await searchParams;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Crear viaje</h2>
      <p className="text-stone-600">Crea un viaje base y luego agrega items (actividades, hospedaje, transporte).</p>
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}
      <form action={createTripAction} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-2">
        <input
          className="rounded-lg border border-stone-300 px-3 py-2"
          name="title"
          placeholder="Nombre del viaje"
          required
        />
        <input className="rounded-lg border border-stone-300 px-3 py-2" name="destination" placeholder="Destino" />
        <label className="space-y-1 text-sm">
          <span>Fecha inicio</span>
          <input className="w-full rounded-lg border border-stone-300 px-3 py-2" name="start_date" type="date" />
        </label>
        <label className="space-y-1 text-sm">
          <span>Fecha fin</span>
          <input className="w-full rounded-lg border border-stone-300 px-3 py-2" name="end_date" type="date" />
        </label>
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
          Crear viaje
        </button>
      </form>
    </section>
  );
}
