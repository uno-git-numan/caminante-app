"use server";

// Genera los captions del kit con IA y los guarda en experiences.data.kitCaptions.
// Se re-verifica admin (el gate del layout no cubre actions).
//
// ⚠️ POR QUÉ VA EN LOTES (bug del 20 jul, medido):
// Una sola llamada con las 18 piezas (10 canónicas + serie E) tarda **101.6s**
// con Opus (7,746 tokens de salida a ~76 tok/s). La función corre con
// `maxDuration = 60` y Hobby NO permite subirlo: Vercel mataba la función a los
// 60s, el `redirect(?error=)` nunca llegaba a ejecutarse y la UI quedaba
// EXACTAMENTE IGUAL — el botón parecía no responder. Barrancas y volcanes se
// quedaron sin captions por esto.
// Antes cabía: con 10 piezas y captions de 2–4 frases eran ~2,000 tokens. La
// serie E + el formato narrativo (párrafos + 3 porqués + pregunta + trigger)
// triplicó el volumen.
// Solución: lotes de 4 piezas (~28s medidos, peor lote de 5 = 34.6s) con
// guardado INCREMENTAL. Si un lote falla, los anteriores YA están en la base.
//
// ⚠️ NO cambiar a Sonnet "porque es más rápido": se midió y es al revés —
// Sonnet 5 tardó 39.5s contra 14.2s de Opus en el mismo lote (3.7× más tokens
// de salida) y además SE INVENTÓ una especie que no estaba en el resumen
// («Amanita basii»), justo lo que el sistema prohíbe. Opus se queda.
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchKitContext } from "@/lib/kit/queries";
import { PIEZAS, PIEZAS_E } from "@/lib/kit/kit";
import { generateKitCaptions, type KitCaptions } from "@/lib/ai/kit-captions";

// (El tamaño de lote vive en captions-lote.ts — un archivo "use server" solo
// puede exportar funciones async — y lo consume el runner del cliente.)
export type LoteResult = { ok: true; ids: string[] } | { ok: false; error: string };

// Ids de las piezas que HOY tienen sus insumos listos (las pendientes no se
// mandan a la IA: no hay nada que redactar).
export async function listarPiezasListas(slug: string): Promise<string[]> {
  if (!(await isCurrentUserAdmin())) return [];
  const ctx = await fetchKitContext(slug);
  if (!ctx) return [];
  return [...PIEZAS, ...PIEZAS_E].filter((p) => p.build(ctx).estado === "lista").map((p) => p.id);
}

// Genera UN lote y lo FUSIONA en data.kitCaptions (nunca reemplaza: si esto
// pisara el objeto entero, cada lote borraría los anteriores).
export async function generarLoteCaptions(slug: string, ids: string[]): Promise<LoteResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Sin permiso." };
  if (!slug || !ids.length) return { ok: false, error: "Lote vacío." };

  const ctx = await fetchKitContext(slug);
  if (!ctx) return { ok: false, error: "No se encontró la experiencia (guárdala antes de generar captions)." };

  const piezas = [...PIEZAS, ...PIEZAS_E].filter((p) => ids.includes(p.id) && p.build(ctx).estado === "lista");
  if (!piezas.length) return { ok: false, error: "Ninguna pieza de este lote tiene sus insumos listos." };

  const res = await generateKitCaptions(ctx, piezas);
  if (!res.ok) return { ok: false, error: res.error };

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb.from("experiences").select("data").eq("slug", slug).maybeSingle();
  if (!row) return { ok: false, error: "No se pudo guardar (experiencia no encontrada)." };
  const data = (row.data ?? {}) as Record<string, unknown>;
  const previos = (data.kitCaptions ?? {}) as KitCaptions;
  // MERGE, no reemplazo — lo generado en lotes anteriores sobrevive.
  data.kitCaptions = { ...previos, ...(res as { ok: true; captions: KitCaptions }).captions };
  const { error } = await sb.from("experiences").update({ data }).eq("slug", slug);
  if (error) return { ok: false, error: `No se pudo guardar: ${error.message}` };

  revalidatePath(`/caminante/admin/kit/${slug}`);
  revalidatePath(`/caminante/admin/experiencias/${slug}`);
  return { ok: true, ids: Object.keys((res as { ok: true; captions: KitCaptions }).captions) };
}
