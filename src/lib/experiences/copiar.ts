import "server-only";

// PARTIR DE UNA QUE YA EXISTE.
//
// Casi ninguna experiencia nace de cero. Una salida nueva a la Hacienda San
// Andrés reusa el lugar, las fotos, las cláusulas del deslinde, la ficha
// científica del bosque, los aliados y hasta el tono: lo que cambia es el
// itinerario, las fechas y el precio. Escribir todo eso otra vez no es sólo
// trabajo de más — es la puerta por la que entran las diferencias que nadie
// quería (dos veces el mismo lugar descrito distinto, un deslinde que perdió
// una cláusula en el recorrido).
//
// ⚠️ COPIAR NO ES CLONAR. Qué viaja y qué no lo decide `copiar-contrato.ts`,
// que es puro a propósito: la pantalla necesita leer esa lista para decirla, y
// desde un componente cliente no se puede tocar este módulo.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import type { Copiable } from "./copiar-contrato";

export { LO_QUE_NO_VIAJA, limpiarParaCopia } from "./copiar-contrato";
export type { Copiable } from "./copiar-contrato";

const nombreDe = (d: Record<string, unknown>, slug: string): string => {
  const doc = typeof d.docTitle === "string" ? d.docTitle.trim() : "";
  if (doc) return doc;
  const t = [d.title, d.titleAccent].filter((x) => typeof x === "string" && x.trim()).join(" ");
  return t.trim() || slug;
};

/**
 * De cuáles se puede partir.
 *
 * ⚠️ EL ALCANCE MANDA, igual que en editar: la casa ve todas, la operadora
 * SOLO las suyas. Sin este filtro, «partir de una existente» sería una puerta
 * lateral para leer la ficha completa de la competencia —precios, aliados,
 * proveedores— desde una pantalla que parece inofensiva.
 */
export async function experienciasCopiables(): Promise<Copiable[]> {
  const a = await alcanceActual();
  if (!a) return [];

  const sb = createSupabaseAdminClient();
  let q = sb.from("experiences").select("slug, status, data, operator_id");
  if (esOperador(a)) q = q.eq("operator_id", a.operatorId);

  const { data, error } = await q;
  if (error) {
    // Sin poder confirmar de quién es cada una, no se ofrece ninguna.
    console.error("experienciasCopiables:", error);
    return [];
  }

  return ((data ?? []) as { slug: string; status: string; data: Record<string, unknown> | null }[])
    .filter((r) => r.data)
    .map((r) => ({
      slug: r.slug,
      titulo: nombreDe(r.data!, r.slug),
      donde: typeof r.data!.estado === "string" ? (r.data!.estado as string) : "",
      publicada: r.status === "published",
    }))
    // Las publicadas primero: son las que están probadas y de las que uno
    // quiere partir. Dentro de cada grupo, alfabético.
    .sort((x, y) =>
      x.publicada === y.publicada ? x.titulo.localeCompare(y.titulo, "es") : x.publicada ? -1 : 1,
    );
}
