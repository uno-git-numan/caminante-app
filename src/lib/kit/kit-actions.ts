"use server";

// Genera los captions del kit con IA y los guarda en experiences.data.kitCaptions.
// Se re-verifica admin (el gate del layout no cubre actions). Un botón en la página
// dispara esto; el resultado persiste (no se regenera en cada carga).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchKitContext } from "@/lib/kit/queries";
import { PIEZAS } from "@/lib/kit/kit";
import { generateKitCaptions, type KitCaptions } from "@/lib/ai/kit-captions";

export async function generarKitCaptions(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;
  const base = `/caminante/admin/kit/${slug}`;

  const ctx = await fetchKitContext(slug);
  if (!ctx) redirect(`${base}?error=${encodeURIComponent("No se encontró la experiencia.")}`);

  const listas = PIEZAS.filter((p) => p.build(ctx!).estado === "lista");
  const res = await generateKitCaptions(ctx!, listas);
  if (!res.ok) redirect(`${base}?error=${encodeURIComponent(res.error)}`);

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb.from("experiences").select("data").eq("slug", slug).maybeSingle();
  if (!row) redirect(`${base}?error=${encodeURIComponent("No se pudo guardar.")}`);
  const data = (row.data ?? {}) as Record<string, unknown>;
  data.kitCaptions = (res as { ok: true; captions: KitCaptions }).captions;
  await sb.from("experiences").update({ data }).eq("slug", slug);

  revalidatePath(base);
  redirect(`${base}?ok=${encodeURIComponent(`Captions generados para ${listas.length} piezas.`)}`);
}
