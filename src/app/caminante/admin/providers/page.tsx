import { createProviderAction } from "@/lib/admin/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface ProvidersAdminPageProps {
  searchParams: Promise<{ created?: string; error?: string }>;
}

export default async function ProvidersAdminPage({
  searchParams,
}: ProvidersAdminPageProps) {
  const { created, error } = await searchParams;
  let providers:
    | Array<{
        id: string;
        display_name: string;
        legal_name: string;
        country_code: string;
        approval_state: string;
      }>
    | null = null;
  let missingServiceRole = false;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("providers")
      .select("id,display_name,legal_name,country_code,approval_state")
      .order("updated_at", { ascending: false })
      .limit(50);
    providers = data ?? [];
  } catch {
    missingServiceRole = true;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Providers</h2>
      <p className="text-stone-600">Create providers using service-role writes (hybrid model).</p>
      {created === "1" ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Provider creado.</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{decodeURIComponent(error)}</p>
      ) : null}
      {missingServiceRole ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Configure `SUPABASE_SERVICE_ROLE_KEY` for admin provider writes.
        </p>
      ) : (
        <>
          <form action={createProviderAction} className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 md:grid-cols-2">
            <input
              className="rounded-lg border border-stone-300 px-3 py-2"
              name="legal_name"
              placeholder="Legal name"
              required
            />
            <input
              className="rounded-lg border border-stone-300 px-3 py-2"
              name="display_name"
              placeholder="Display name"
              required
            />
            <input className="rounded-lg border border-stone-300 px-3 py-2" name="country_code" defaultValue="MX" />
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
            >
              Crear provider
            </button>
          </form>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-100 text-left">
                <tr>
                  <th className="px-3 py-2">Display</th>
                  <th className="px-3 py-2">Legal</th>
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {providers?.map((provider) => (
                  <tr key={provider.id} className="border-t border-stone-200">
                    <td className="px-3 py-2">{provider.display_name}</td>
                    <td className="px-3 py-2">{provider.legal_name}</td>
                    <td className="px-3 py-2">{provider.country_code}</td>
                    <td className="px-3 py-2">{provider.approval_state}</td>
                    <td className="px-3 py-2 text-xs text-stone-500">{provider.id}</td>
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
