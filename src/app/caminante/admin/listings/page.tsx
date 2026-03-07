import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createListingAction } from "@/lib/admin/actions";

interface ListingsAdminPageProps {
  searchParams: Promise<{ created?: string; error?: string }>;
}

export default async function ListingsAdminPage({
  searchParams,
}: ListingsAdminPageProps) {
  const { created, error } = await searchParams;
  let rows:
    | Array<{
        id: string;
        title: string;
        type: string;
        status: string;
        destination: string | null;
      }>
    | null = null;
  let providers: Array<{ id: string; display_name: string }> | null = null;
  let missingServiceRole = false;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("listings")
      .select("id,title,type,status,destination")
      .order("updated_at", { ascending: false })
      .limit(50);
    rows = data ?? [];
    const { data: providerRows } = await supabase
      .from("providers")
      .select("id,display_name")
      .order("display_name", { ascending: true })
      .limit(200);
    providers = providerRows ?? [];
  } catch {
    missingServiceRole = true;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Listings Admin</h2>
      <p className="text-stone-600">Manage activities, transport, accommodations, and packages.</p>
      {created === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Listing creado.</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}
      {missingServiceRole ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Configure `SUPABASE_SERVICE_ROLE_KEY` to load full admin inventory.
        </p>
      ) : (
        <>
          <form action={createListingAction} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Provider</span>
              <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="provider_id" required>
                <option value="">Selecciona provider</option>
                {providers?.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Type</span>
              <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="type" defaultValue="activity">
                <option value="activity">activity</option>
                <option value="transport">transport</option>
                <option value="accommodation">accommodation</option>
                <option value="package">package</option>
              </select>
            </label>
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="title" placeholder="Title" required />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="destination" placeholder="Destination" />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="vibe" placeholder="Vibe" />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="difficulty" placeholder="Difficulty" />
            <label className="space-y-1 text-sm md:col-span-2">
              <span>Description</span>
              <textarea className="w-full rounded-lg border border-stone-300 px-3 py-2" name="description" rows={3} />
            </label>
            <label className="space-y-1 text-sm">
              <span>Status</span>
              <select className="w-full rounded-lg border border-stone-300 px-3 py-2" name="status" defaultValue="draft">
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
              Crear listing
            </button>
          </form>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-100 text-left">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Destination</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {rows?.map((row) => (
                  <tr key={row.id} className="border-t border-stone-200">
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">{row.destination ?? "-"}</td>
                    <td className="px-3 py-2 text-xs text-stone-500">{row.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
