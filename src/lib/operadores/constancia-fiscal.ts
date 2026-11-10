import "server-only";

// La constancia fiscal vigente de cada operadora y lo que se puede tomar de
// ella. Lo usan la pantalla de Cobrar (para enseñar los datos y, si la
// constancia trae dos regímenes de negocio, ofrecer sólo ésos) y las acciones
// que eligen régimen o vuelven a leer la constancia.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AnalisisCsf } from "./csf";
import { datosFiscalesDeCsf, type ResultadoFiscal } from "./fiscal-de-csf";

export type ConstanciaFiscal = { docId: string; resultado: ResultadoFiscal } | null;

/** La última constancia general (sin actividad) de cada operadora, ya interpretada. */
export async function constanciasDe(operatorIds: string[]): Promise<Map<string, ConstanciaFiscal>> {
  const out = new Map<string, ConstanciaFiscal>();
  if (operatorIds.length === 0) return out;
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operator_documents")
    .select("id, operator_id, analisis, subido_at")
    .eq("documento", "csf")
    .is("actividad", null)
    .in("operator_id", operatorIds)
    .order("subido_at", { ascending: false });
  if (error) {
    console.error("constanciasDe:", error.message);
    return out;
  }
  for (const f of (data ?? []) as { id: string; operator_id: string; analisis: AnalisisCsf | null }[]) {
    if (out.has(f.operator_id)) continue; // la más reciente manda
    out.set(f.operator_id, { docId: f.id, resultado: datosFiscalesDeCsf(f.analisis) });
  }
  return out;
}

/** Lo que la pantalla de Cobrar necesita saber de la constancia (CobrosPanel). */
export function constanciaParaPanel(c: ConstanciaFiscal | undefined): {
  subida: boolean;
  ok: boolean;
  porque: string | null;
  regimenes: string[];
} {
  if (!c) return { subida: false, ok: false, porque: null, regimenes: [] };
  return c.resultado.ok
    ? { subida: true, ok: true, porque: null, regimenes: c.resultado.datos.regimenes }
    : { subida: true, ok: false, porque: c.resultado.porque, regimenes: [] };
}
