import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// EL PERFIL DEL OPERADOR — vivo, suyo, sembrado desde su solicitud.
//
// Lo que nos entregó para ser aprobado es JUSTO lo que a un viajero le da
// confianza: desde cuándo opera, cuánta gente lleva, si tiene seguro, cuántos
// guías por persona. Hasta hoy eso moría en `operator_applications` y su
// perfil público sólo enseñaba nombre, bio, Instagram y fotos.
//
// Se COPIA, no se lee de la solicitud. Son dos cosas distintas: la solicitud es
// lo que declaró ESE DÍA y no se toca nunca; el perfil cambia con los años y lo
// edita él. Leerlo de la solicitud haría que corregir su perfil reescribiera su
// declaración.

export type PerfilOperador = {
  ciudad_estado?: string;
  tipo_operacion?: string;
  antiguedad?: string;
  salidas_ano?: string;
  personas_salida?: string;
  seguro_rc?: string;
  primeros_auxilios?: string;
  ratio_guias?: string;
  /** De qué solicitud se sembró. Sirve para saber qué es declarado y qué escribió él. */
  sembrado_de?: string;
};

/** Qué ve el viajero en su página pública, y qué es sólo para la casa. */
export const ES_PUBLICO: Record<keyof PerfilOperador, boolean> = {
  ciudad_estado: true,
  tipo_operacion: true,
  antiguedad: true,
  salidas_ano: false,
  personas_salida: true,
  seguro_rc: true,
  primeros_auxilios: true,
  ratio_guias: true,
  sembrado_de: false,
};

type SolicitudPerfil = {
  id: string;
  ciudad_estado: string | null; tipo_operacion: string | null; antiguedad: string | null;
  salidas_ano: string | null; personas_salida: string | null; seguro_rc: string | null;
  primeros_auxilios: string | null; ratio_guias: string | null;
  descripcion: string | null; instagram: string | null; whatsapp: string | null;
};

/**
 * Siembra el perfil al aprobar. NUNCA pisa lo que el operador ya escribió: lo
 * declarado hace meses no debe ganarle a lo que él corrigió ayer.
 */
export async function sembrarPerfilDesdeSolicitud(
  operadorId: string,
  app: SolicitudPerfil,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select("perfil, bio, instagram, whatsapp")
    .eq("id", operadorId)
    .maybeSingle();
  const actual = (data ?? {}) as { perfil?: PerfilOperador; bio?: string | null; instagram?: string | null; whatsapp?: string | null };

  const declarado: PerfilOperador = {
    ciudad_estado: app.ciudad_estado ?? undefined,
    tipo_operacion: app.tipo_operacion ?? undefined,
    antiguedad: app.antiguedad ?? undefined,
    salidas_ano: app.salidas_ano ?? undefined,
    personas_salida: app.personas_salida ?? undefined,
    seguro_rc: app.seguro_rc ?? undefined,
    primeros_auxilios: app.primeros_auxilios ?? undefined,
    ratio_guias: app.ratio_guias ?? undefined,
    sembrado_de: app.id,
  };
  for (const k of Object.keys(declarado) as (keyof PerfilOperador)[]) {
    if (declarado[k] === undefined) delete declarado[k];
  }

  const vacio = (s: string | null | undefined) => !s || !s.trim();
  await sb
    .from("operators")
    .update({
      // Lo suyo a la derecha: si ya lo editó, su versión manda.
      perfil: { ...declarado, ...(actual.perfil ?? {}) },
      bio: vacio(actual.bio) ? app.descripcion : actual.bio,
      instagram: vacio(actual.instagram) ? app.instagram : actual.instagram,
      whatsapp: vacio(actual.whatsapp) ? app.whatsapp : actual.whatsapp,
    })
    .eq("id", operadorId);
}
