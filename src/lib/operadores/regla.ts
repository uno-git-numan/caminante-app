import "server-only";

// DE DÓNDE SALE LA COMISIÓN DE UN OPERADOR — tarifa única (23 nov 2026).
//
// Convenio v3.5, Tercera §2: «Caminante no pacta con ningún Operador una
// comisión distinta». La regla es la misma para todas: la tarifa de la casa,
// 8 % si la operadora trajo al cliente y 12 % si lo trajo Caminante
// (`comision.ts`). Cuál de las dos lo decide cada venta, no esta función.
//
//   1. UN CONVENIO FIRMADO CON PORCENTAJE PLANO se sigue respetando: lo firmado
//      no se le cambia a nadie por un cambio de la casa. Hoy no existe ninguno
//      (nadie firmó antes de la v3.5) y la firma ya no puede crear uno.
//   2. TODO LO DEMÁS, la tarifa de la casa.
//
// ⚠️ `operators.commission_pct` YA NO SE LEE AQUÍ. Hasta el 23 nov un número en
// esa columna era «lo pactado sin firmar» y se cobraba como plano: Kéntro traía
// un 20. Con tarifa única eso sería cobrarle a una operadora —parte relacionada
// además— algo distinto de lo que dice el convenio que va a firmar.
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
  /** `pactada` ya no se produce (tarifa única); se conserva el nombre para las pantallas que lo leen. */
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

  return DE_LA_CASA();
}

/** El operador dueño de una experiencia, por slug. Null = de la casa o no existe. */
export async function operadorDeExperiencia(slug: string): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("experiences").select("operator_id").eq("slug", slug).maybeSingle();
  return ((data as { operator_id: string | null } | null)?.operator_id) ?? null;
}
