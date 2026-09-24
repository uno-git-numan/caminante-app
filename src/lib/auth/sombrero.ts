// EL SOMBRERO — con cuál de mis operadoras estoy mirando el panel.
//
// Caminante y Kéntro las opera la misma empresa (Druidas) y son operadoras como
// cualquier otra. Nomádika es de alguien más. Hasta el 24 sep 2026 el panel con
// sesión de admin no filtraba por ninguna: la operación de Nomádika —su CRM,
// sus rosters, los datos médicos de su gente— se veía desde la misma pantalla
// que la propia. Sus números y su expediente sí son de la plataforma y se
// siguen viendo con el sombrero de numan; su operación no.
//
// ⚠️ EL SOMBRERO ACOTA LO QUE VES, NUNCA LO QUE PUEDES. El alcance sigue siendo
// `{tipo:"casa"}` y `esOperador()` sigue devolviendo false, así que las guardas
// de autorización —registrar una liquidación, aprobar una operadora, mover
// comisiones— no se enteran de que traes sombrero y siguen dejándote pasar. La
// alternativa (convertir el alcance en «operador») habría sido un candado que
// se cierra sobre la casa: con el sombrero puesto no habrías podido liquidar.
//
// Por eso esto vive aparte de `alcance.ts` y sólo lo lee `operadorDelAlcance`,
// que es por donde pasa el filtrado de datos del panel entero.
//
// ⚠️ Y NO ES UNA PUERTA. Una operadora que no es `propia` no se puede poner de
// sombrero aunque alguien escriba su slug: no daría acceso a nada que la casa
// no tenga ya —la casa lo ve todo— pero sí volvería la cookie un lugar donde
// «elegir a quién mirar», que es justo lo contrario de para qué existe.

import { cache } from "react";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** El nombre de la cookie. Vive aquí para que la ruta que la escribe y el
    lector no puedan discrepar. */
export const COOKIE_SOMBRERO = "sombrero_operadora";

export type OperadoraPropia = { id: string; slug: string; nombre: string };

/**
 * Las operadoras que tienen sombrero, en el orden en que se dieron de alta.
 *
 * Vacío es un estado legítimo y transitorio: la 0069 la aplica Luis a mano, así
 * que entre que este código sale y la columna existe hay minutos en que no hay
 * ninguna. Ahí NO se filtra nada —se ve todo, como hasta hoy— en vez de dejar
 * el panel en blanco. Es la única vez que fallar abierto es lo correcto: lo que
 * está en juego no es un permiso, es un recorte de vista, y un panel vacío se
 * lee como una falla del sistema y no como una decisión.
 */
export const operadorasPropias = cache(async (): Promise<OperadoraPropia[]> => {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .select("id, slug, name")
    .eq("propia", true)
    .neq("estado", "baja")
    .order("created_at");
  if (error) return [];
  return ((data ?? []) as { id: string; slug: string | null; name: string | null }[])
    .filter((o): o is { id: string; slug: string; name: string | null } => !!o.slug)
    .map((o) => ({ id: o.id, slug: o.slug, nombre: o.name || "Operadora" }));
});

/**
 * Qué sombrero trae puesto esta sesión, o null si no hay ninguno que poner.
 *
 * Sin cookie se usa la PRIMERA propia, no «todas»: si el default fuera ver todo,
 * la operación de Nomádika seguiría a la vista de quien nunca toque la pastilla
 * —o sea, siempre—. El default es la decisión, no la excepción.
 */
export const sombreroPuesto = cache(async (): Promise<OperadoraPropia | null> => {
  const propias = await operadorasPropias();
  if (!propias.length) return null;
  const pedido = (await cookies()).get(COOKIE_SOMBRERO)?.value?.trim();
  // Una cookie que nombra algo que ya no es propia (se dio de baja, se le quitó
  // la marca) cae al default en vez de dejar de filtrar.
  return propias.find((o) => o.slug === pedido) ?? propias[0];
});
