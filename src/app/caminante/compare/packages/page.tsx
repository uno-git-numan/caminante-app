import Link from "next/link";
import { searchPublishedListings } from "@/lib/listings/queries";

interface ComparePackagesPageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePackagesPage({
  searchParams,
}: ComparePackagesPageProps) {
  const { ids } = await searchParams;
  const all = await searchPublishedListings({ type: "package", limit: 20 });
  const selectedIds = (ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);
  const selected = all.filter((item) => selectedIds.includes(item.id));

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Comparar paquetes</h2>
      <p className="text-stone-600">Selecciona 2-4 paquetes con `?ids=id1,id2` para comparar.</p>
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <h3 className="mb-2 font-semibold">Paquetes disponibles</h3>
        <ul className="space-y-1">
          {all.map((item) => (
            <li key={item.id}>
              <Link className="text-emerald-700 hover:underline" href={`/caminante/listings/${item.id}`}>
                {item.title}
              </Link>{" "}
              <span className="text-stone-500">({item.id})</span>
            </li>
          ))}
        </ul>
      </div>
      {selected.length >= 2 ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-100 text-left">
              <tr>
                <th className="px-3 py-2">Paquete</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Vibe</th>
                <th className="px-3 py-2">Dificultad</th>
                <th className="px-3 py-2">Disponibilidad</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((item) => (
                <tr key={item.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2">TODO</td>
                  <td className="px-3 py-2">{item.vibe ?? "n/a"}</td>
                  <td className="px-3 py-2">{item.difficulty ?? "n/a"}</td>
                  <td className="px-3 py-2">TODO</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-stone-600">Agrega al menos 2 IDs para comparar.</p>
      )}
    </section>
  );
}
