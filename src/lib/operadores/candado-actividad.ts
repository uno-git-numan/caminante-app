import "server-only";

// EL CANDADO DE PUBLICAR POR ACTIVIDAD.
//
// Una experiencia dice de qué actividad es (`experiences.actividad`, columna de
// la 0058). Publicarla exige que ESA actividad esté aprobada en el expediente
// de quien la opera. No basta con que la operadora esté aprobada: aprobar a
// nomádika no aprueba su buceo. Ese fue el punto entero de la 0058.
//
// ⚠️ POR ACTIVIDAD, NO GLOBAL. Que el buceo esté a medias no debe tumbar el
// senderismo que ya se revisó: lo aprobado sigue vendiendo. Por eso este candado
// pregunta por UNA actividad y nunca por el expediente completo.
//
// ⚠️ LA CASA NO TIENE EXPEDIENTE. Las experiencias propias (`operator_id IS
// NULL`) no pasan por aquí: no hay a quién pedirle papeles y bloquearlas sería
// inventar un trámite que no existe. Su candado es otro —deslinde y encuesta,
// `flujo-venta.ts`— y ese sí las cubre.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVIDADES, nombreDeActividad, requisitosDe } from "./actividades";
import type { EstadoActividad } from "./expediente";

export type MotivoCandado = "sin_actividad" | "no_declarada" | "no_aprobada";

export type CandadoActividad =
  | { ok: true }
  | {
      ok: false;
      motivo: MotivoCandado;
      /** El slug de la actividad. `null` sólo cuando la experiencia no la declaró. */
      actividad: string | null;
      /** Su nombre humano, ya resuelto: nadie debería leer «alta-montana». */
      nombre: string | null;
      /** En qué estado está su carpeta hoy. `null` si ni siquiera la declaró. */
      estado: EstadoActividad | null;
      /** Cuántos documentos propios pide esa actividad. Para decir en qué se mete. */
      documentos: number;
      /** Una frase, ya escrita, lista para enseñarse tal cual. */
      mensaje: string;
    };

const VALIDAS = new Set(ACTIVIDADES.map((a) => a.slug));

/**
 * ¿Puede publicarse esta experiencia?
 *
 * `operatorId` sale de la fila de la experiencia (o de la sesión, si nace
 * ahora), NUNCA del formulario: si viniera del cliente, cualquiera podría
 * mandar `null` y saltarse el candado diciendo que es de la casa.
 */
export async function actividadListaParaPublicar(
  operatorId: string | null,
  actividad: string | null | undefined,
): Promise<CandadoActividad> {
  if (!operatorId) return { ok: true };

  const slug = (actividad ?? "").trim();
  if (!slug || !VALIDAS.has(slug)) {
    return {
      ok: false,
      motivo: "sin_actividad",
      actividad: null,
      nombre: null,
      estado: null,
      documentos: 0,
      mensaje:
        "Esta experiencia todavía no dice de qué actividad es. Elígela en el formulario: " +
        "de ella depende qué papeles se te piden y qué puedes publicar.",
    };
  }

  const nombre = nombreDeActividad(slug);
  const documentos = requisitosDe(slug).propios.length;

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operator_activities")
    .select("estado")
    .eq("operator_id", operatorId)
    .eq("actividad", slug)
    .maybeSingle();

  const estado = (data as { estado: string } | null)?.estado as EstadoActividad | undefined;

  if (!estado) {
    return {
      ok: false,
      motivo: "no_declarada",
      actividad: slug,
      nombre,
      estado: null,
      documentos,
      mensaje:
        `Todavía no declaras ${nombre.toLowerCase()}. Nadie te la va a pedir mientras no la quieras ` +
        `ofrecer, pero para publicar esta experiencia hace falta su expediente.`,
    };
  }
  if (estado === "aprobada") return { ok: true };

  // `en_revision` no es un rechazo: es «ya lo mandaste, estamos en ello». Se
  // dice distinto porque del otro lado no hay nada que hacer.
  const mensaje =
    estado === "en_revision"
      ? `Tu expediente de ${nombre.toLowerCase()} está en revisión. En cuanto lo aprobemos puedes publicar; ` +
        `mientras tanto tu borrador se queda guardado, completo.`
      : estado === "suspendida"
        ? `Tu expediente de ${nombre.toLowerCase()} está suspendido, así que esa actividad no puede vender ` +
          `hasta que se resuelva. Escríbenos y lo vemos.`
        : `Para publicar esta experiencia hace falta el expediente de ${nombre.toLowerCase()}, ` +
          `que son ${documentos} ${documentos === 1 ? "documento" : "documentos"} propios.`;

  return { ok: false, motivo: "no_aprobada", actividad: slug, nombre, estado, documentos, mensaje };
}

/**
 * A dónde se manda a alguien a quien el candado detuvo.
 *
 * Lleva el borrador consigo para que la pantalla del expediente pueda decir por
 * qué lo trajimos y devolverlo de una sola vez — «volvemos solos a tu borrador».
 */
export function rutaDelCandado(slug: string, actividad: string | null): string {
  const q = new URLSearchParams({ borrador: slug });
  if (actividad) q.set("actividad", actividad);
  return `/caminante/admin/mi-alta/expediente?${q.toString()}`;
}
