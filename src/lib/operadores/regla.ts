import "server-only";

// DE DÓNDE SALE LA COMISIÓN DE UN OPERADOR — una sola cadena de autoridad.
//
// El orden NO es un fallback cualquiera: va de lo más firmado a lo menos.
//
//   1. EL CONVENIO FIRMADO. `operator_agreements.comision_pct` queda congelado al
//      firmar y la tabla es append-only (0050). Si alguien edita
//      `operators.commission_pct` de 20 a 18, lo que ese operador firmó sigue
//      siendo 20 — y la calculadora tiene que decir 20, porque es lo que él va a
//      reclamar cuando le llegue su corte.
//   2. LO PACTADO SIN FIRMAR. `operators.commission_pct` — ya se acordó un número
//      pero el convenio todavía no se firma.
//   3. LA ESCALA DE LA CASA. Nadie pactó nada: aplica la tabla por tramos.
//
// ⚠️ SE RESUELVE POR EL OPERADOR DUEÑO DE LA EXPERIENCIA, no por quien tiene la
// sesión abierta. Cuando la casa edita la experiencia de Kéntro, el precio que
// se sugiere tiene que salir del convenio de KÉNTRO. Resolverlo por la sesión
// haría que Luis armara los precios de otro con la tabla equivocada, y el
// operador recibiría un neto distinto del que la pantalla le prometió.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Escala, Regla } from "./comision";

export type ReglaResuelta = {
  regla: Regla;
  /** De dónde salió, para poder decírselo a quien mira la pantalla. */
  origen: "convenio" | "pactada" | "escala";
};

/** Sin operador dueño (experiencia de la casa, o todavía sin asignar): la escala. */
const DE_LA_CASA = (escala: Escala = "venta"): ReglaResuelta => ({
  regla: { tipo: "escala", escala },
  origen: "escala",
});

export async function reglaComisionDeOperador(
  operatorId: string | null | undefined,
): Promise<ReglaResuelta> {
  if (!operatorId) return DE_LA_CASA();
  const sb = createSupabaseAdminClient();

  // El convenio MÁS RECIENTE que haya firmado. Si firmó v1 y luego v2, manda v2.
  //
  // ⚠️ SE LEEN LAS DOS COLUMNAS. `comision_pct` a solas miente: viene en NULL
  // cuando lo que se firmó fue la ESCALA, y esta función lo leía como «no firmó
  // nada» y seguía de largo al siguiente eslabón. Con la escala firmada el
  // resultado era el mismo por casualidad —la escala otra vez— pero por el
  // camino equivocado: `origen` decía «escala» donde debía decir «convenio», y
  // ese dato es el que la pantalla usa para decirle a alguien si lo suyo ya
  // está firmado. Ver la 0062.
  const { data: firma } = await sb
    .from("operator_agreements")
    .select("comision_regla, comision_pct, firmado_at")
    .eq("operator_id", operatorId)
    .order("firmado_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const f = firma as { comision_regla: string | null; comision_pct: number | null } | null;
  if (f?.comision_regla === "escala") {
    // Cuál de las dos escalas NO se congela: la decide cada venta según quién
    // trajo al cliente (`escalaPara`). El checkout la recalcula; aquí se
    // devuelve «venta», que es la cara y por lo tanto la prudente para sugerir
    // un precio.
    return { regla: { tipo: "escala", escala: "venta" }, origen: "convenio" };
  }
  if (f?.comision_pct != null) {
    return { regla: { tipo: "plano", pct: Number(f.comision_pct) }, origen: "convenio" };
  }

  const { data: op } = await sb
    .from("operators")
    .select("commission_pct")
    .eq("id", operatorId)
    .maybeSingle();
  const pactada = (op as { commission_pct: number | null } | null)?.commission_pct;
  if (pactada != null) return { regla: { tipo: "plano", pct: Number(pactada) }, origen: "pactada" };

  return DE_LA_CASA();
}

/** El operador dueño de una experiencia, por slug. Null = de la casa o no existe. */
export async function operadorDeExperiencia(slug: string): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("experiences").select("operator_id").eq("slug", slug).maybeSingle();
  return ((data as { operator_id: string | null } | null)?.operator_id) ?? null;
}
