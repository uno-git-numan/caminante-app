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
// ⚠️ LA CASA NO TIENE EXPEDIENTE. No hay a quién pedirle papeles y bloquearla
// sería inventar un trámite que no existe. Su candado es otro —deslinde y
// encuesta, `flujo-venta.ts`— y ese sí la cubre.
//
// ⚠️⚠️ Y LA CASA NO ES `operator_id IS NULL`. Eso dio por hecho esta función al
// escribirse, y era falso: la casa opera bajo su propia fila de `operators`
// —«Numan · Caminante», la que lleva `es_la_casa = true`— igual que cualquier
// otra operadora. Medido el 13 sep 2026: de las diez experiencias de la base,
// NINGUNA tiene `operator_id` en NULL; siete cuelgan de esa fila. La exención
// nunca se cumplió una sola vez: era código muerto.
//
// Lo que eso provocaba no se veía. Las cinco experiencias publicadas de la casa
// pasaban el candado con «no_declarada» —la casa no declara actividades— así
// que al siguiente «Guardar cambios (en vivo)» desde el formulario se
// degradaban a BORRADOR y se caían del sitio. Con su mensaje, sí, pero nadie
// espera que guardar un cambio de texto despublique la página.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVIDADES, nombreDeActividad, requisitosDe } from "./actividades";
import { anexoAlDia } from "./subconvenio";
import type { EstadoActividad } from "./expediente";

export type MotivoCandado = "sin_actividad" | "no_declarada" | "no_aprobada" | "sin_anexo";

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
 * ¿Esta operadora es la casa?
 *
 * ⚠️ ANTE LA DUDA, EL CANDADO SÍ MUERDE. Si la consulta falla no sabemos de
 * quién es la experiencia, y las dos equivocaciones no cuestan lo mismo:
 * bloquear a la casa por un parpadeo de la base es una molestia con mensaje
 * claro y el borrador intacto; dejar pasar a una operadora sin expediente
 * aprobado es que alguien suba a una montaña con quien no lo acreditó. Por eso
 * este `false` por defecto, y no el «ante la duda no muerde» de `anexoAlDia`:
 * allá la duda era «todavía no hay dónde firmar», aquí es «no sé quién eres».
 */
async function esLaCasa(operatorId: string): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .select("es_la_casa")
    .eq("id", operatorId)
    .maybeSingle();
  if (error) {
    console.error("esLaCasa:", error);
    return false;
  }
  return (data as { es_la_casa: boolean | null } | null)?.es_la_casa === true;
}

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
  if (await esLaCasa(operatorId)) return { ok: true };

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
  if (estado === "aprobada") {
    // El expediente está aprobado; falta el papel. Es la Cláusula Sexta del
    // convenio dicha en código: «no puede publicar ni vender una experiencia de
    // una actividad cuyo anexo no haya suscrito».
    const anexo = await anexoAlDia(operatorId, slug);
    if (anexo.exigible && !anexo.firmado) {
      return {
        ok: false,
        motivo: "sin_anexo",
        actividad: slug,
        nombre,
        estado,
        documentos,
        mensaje:
          `Tu expediente de ${nombre.toLowerCase()} ya está aprobado. Falta firmar su anexo — ` +
          `el documento que dice qué se te pide para esta actividad en particular. Son dos minutos.`,
      };
    }
    return { ok: true };
  }

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
export function rutaDelCandado(
  slug: string,
  actividad: string | null,
  motivo?: MotivoCandado,
): string {
  // Si lo único que falta es el papel, mandarlo al expediente sería mandarlo a
  // una pantalla donde ya está todo en verde y no hay nada que hacer.
  if (motivo === "sin_anexo") return "/caminante/admin/mi-alta/convenio";
  const q = new URLSearchParams({ borrador: slug });
  if (actividad) q.set("actividad", actividad);
  return `/caminante/admin/mi-alta/expediente?${q.toString()}`;
}

/**
 * Cómo se llama esa liga.
 *
 * Vive PEGADA a `rutaDelCandado` a propósito: la etiqueta estaba escrita fija
 * en el formulario («Ir a mi expediente…») y no miraba el motivo, así que con
 * `sin_anexo` decía «expediente» y llevaba al convenio. El destino era el
 * correcto; la promesa, no. Quien decide a dónde va decide cómo se llama.
 */
export function etiquetaDelCandado(nombre: string | null, motivo?: MotivoCandado): string {
  const de = nombre ? ` de ${nombre.toLowerCase()}` : "";
  return motivo === "sin_anexo" ? `Ir a firmar el anexo${de}` : `Ir a mi expediente${de}`;
}
