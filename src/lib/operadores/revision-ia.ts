import "server-only";

// LA REVISIÓN AUTOMÁTICA DEL EXPEDIENTE.
//
// Luis, 9 nov 2026, sobre la meta del alta en 15 minutos: «Sí» a aprobar solos
// los documentos cuando la IA (y, donde existe, una fuente oficial) los
// confirma; la casa revisa sólo los dudosos. La pantalla prometía «entre tres y
// cinco días hábiles» y era la espera más larga del camino.
//
// Cómo decide, sin adivinar:
//   1 · La IA LEE el documento contra lo que el catálogo pide (nombre y
//       porqué de `actividades.ts`): si es eso, si se lee, a nombre de quién,
//       cuándo vence y si hay señales de que lo editaron.
//   2 · Se APRUEBA SOLO únicamente si todo sale limpio: es lo que se pide, se
//       lee, no hay alertas, la persona coincide (cuando aplica) y, si caduca,
//       la fecha se leyó y está vigente. Cualquier duda lo deja EN REVISIÓN
//       para una persona, con lo que vio la IA escrito.
//   3 · NUNCA RECHAZA. Rechazar le manda un correo a la operadora diciéndole
//       que algo está mal; eso lo decide una persona.
//
// La constancia fiscal no pasa por aquí: tiene su lectura propia y la
// confirma el SAT (csf.ts), y su aprobación automática vive allá.
//
// Lo leído queda en `operator_documents.analisis` (0077) con `tipo:
// "revision"`, para que quien revise sepa por qué se aprobó o por qué no.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GENERALES, requisitosDe, nombreDeActividad, type Documento } from "./actividades";
import { emailActividadAprobada } from "./emails";

const MODEL = "claude-opus-5-5";
const API = "https://api.anthropic.com/v1/messages";
const BUCKET = "expedientes";
/** Quien firma la aprobación automática en `revisado_por`. */
export const REVISOR_AUTOMATICO = "revisión automática";

export type RevisionIa = {
  v: 1;
  tipo: "revision";
  at: string;
  esLoQueSePide: boolean | null;
  legible: boolean | null;
  titular: string | null;
  coincideTitular: boolean | null;
  /** La fecha de vencimiento que trae el documento, `YYYY-MM-DD`. */
  venceAt: string | null;
  alertas: string[];
  resumen: string | null;
  /** Lo que se decidió con eso. */
  veredicto: "aprobado" | "dudoso";
  /** Por qué quedó dudoso, en palabras para una persona. Vacío si se aprobó. */
  razones: string[];
  error?: string;
};

type Leido = Pick<RevisionIa, "esLoQueSePide" | "legible" | "titular" | "coincideTitular" | "venceAt" | "alertas" | "resumen">;

const ESQUEMA = {
  type: "object",
  properties: {
    esLoQueSePide: { type: ["boolean", "null"] },
    legible: { type: ["boolean", "null"] },
    titular: { type: ["string", "null"] },
    coincideTitular: { type: ["boolean", "null"] },
    venceAt: { type: ["string", "null"] },
    alertas: { type: "array", items: { type: "string" } },
    resumen: { type: ["string", "null"] },
  },
  required: ["esLoQueSePide", "legible", "titular", "coincideTitular", "venceAt", "alertas", "resumen"],
  additionalProperties: false,
};

function sistema(doc: Documento, nombres: string[], hoy: string): string {
  return `Revisas un documento del expediente de una operadora de turismo de naturaleza en México.
Se le pidió: «${doc.nombre}». Para qué sirve: ${doc.porQue}
Hoy es ${hoy}.
Extrae SOLO lo que está en el documento. Lo que no aparezca va en null: no lo deduzcas ni lo completes.
- esLoQueSePide: true sólo si el documento ES lo que se pidió (no otro papel parecido, no una foto de otra cosa).
- legible: true si los datos clave se pueden leer.
- titular: a nombre de quién está (persona o empresa), tal como aparece. null si no aplica.
- coincideTitular: ${nombres.length ? `si el titular es alguno de estos: ${nombres.map((n) => `«${n}»`).join(", ")} (mismas personas o empresa aunque cambie el orden, los acentos o las abreviaturas). null si el documento no está a nombre de nadie.` : "null."}
- venceAt: la fecha de fin de vigencia que trae el documento, en YYYY-MM-DD. Si sólo trae el año (como la INE: «VIGENCIA 2031»), usa el 31 de diciembre de ese año. null si no trae.
- alertas: SÓLO señales de que el archivo fue alterado o no es auténtico (tipografías distintas en datos clave, recortes, empalmes, datos que no cuadran entre sí), o de que el documento ya está vencido. Una frase por señal. Lista vacía si no ves ninguna.
- resumen: una frase corta de lo que es el documento (p. ej. «Póliza de RC de GNP, vigente al 3 de marzo de 2027»).
NO copies números de identificación, CURP, domicilios ni datos de salud.`;
}

async function leer(bytes: ArrayBuffer, tipo: string, doc: Documento, nombres: string[]): Promise<Leido | { error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "Falta ANTHROPIC_API_KEY." };
  const data = Buffer.from(bytes).toString("base64");
  const bloque =
    tipo === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : tipo === "image/jpeg" || tipo === "image/png"
        ? { type: "image", source: { type: "base64", media_type: tipo, data } }
        : null;
  if (!bloque) return { error: "Ese formato (HEIC) no se puede leer solo." };
  const hoy = new Date().toISOString().slice(0, 10);
  const res = await fetch(API, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system:
        sistema(doc, nombres, hoy) +
        "\n\nRESPONDE ÚNICAMENTE con un objeto JSON válido — sin markdown ni texto alrededor — que cumpla este JSON Schema:\n" +
        JSON.stringify(ESQUEMA),
      messages: [{ role: "user", content: [bloque, { type: "text", text: "Revisa este documento." }] }],
    }),
    signal: AbortSignal.timeout(50_000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) return { error: `La IA no pudo leerlo: ${json?.error?.message || `HTTP ${res.status}`}` };
  const texto = (json?.content || []).find((b: { type: string }) => b.type === "text")?.text as string | undefined;
  if (!texto) return { error: "La IA no devolvió nada." };
  try {
    const c = JSON.parse(texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1)) as Partial<Leido>;
    const b = (v: unknown) => (typeof v === "boolean" ? v : null);
    const t = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const fecha = t(c.venceAt);
    return {
      esLoQueSePide: b(c.esLoQueSePide),
      legible: b(c.legible),
      titular: t(c.titular),
      coincideTitular: b(c.coincideTitular),
      venceAt: fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
      alertas: Array.isArray(c.alertas) ? c.alertas.filter((x): x is string => typeof x === "string").slice(0, 8) : [],
      resumen: t(c.resumen),
    };
  } catch {
    return { error: "La lectura no se pudo interpretar." };
  }
}

/**
 * El veredicto, puro: qué hace falta para aprobar solo. Se exporta para
 * probarlo regla por regla.
 */
export function veredicto(
  l: Leido,
  ctx: { caduca: boolean; venceEscrita: string | null; hoy: string; pideTitular: boolean },
): { veredicto: "aprobado" | "dudoso"; razones: string[] } {
  const razones: string[] = [];
  if (l.esLoQueSePide !== true) razones.push("No parece ser el documento que se pide.");
  if (l.legible !== true) razones.push("No se alcanza a leer bien.");
  if (ctx.pideTitular && l.coincideTitular === false) razones.push(`Está a nombre de ${l.titular ?? "otra persona"}, no de la operadora.`);
  if (ctx.pideTitular && l.coincideTitular === null) razones.push("No se pudo confirmar a nombre de quién está.");
  for (const a of l.alertas) razones.push(a);
  if (ctx.caduca) {
    const vence = l.venceAt ?? ctx.venceEscrita;
    if (!vence) razones.push("No se leyó la fecha de vencimiento.");
    else if (vence < ctx.hoy) razones.push("Ya está vencido.");
    if (l.venceAt && ctx.venceEscrita && l.venceAt !== ctx.venceEscrita) {
      razones.push(`La fecha escrita (${ctx.venceEscrita}) no es la del documento (${l.venceAt}).`);
    }
  }
  return { veredicto: razones.length ? "dudoso" : "aprobado", razones };
}

/** Documentos que van a nombre de la operadora o de quien la representa. */
const A_SU_NOMBRE = new Set(["id-responsable", "rnt", "poliza-rc", "poliza-gm", "acta-constitutiva"]);

/**
 * Lee el documento `docId`, guarda lo leído y, si todo sale limpio, lo aprueba.
 * Nunca lanza: si algo falla, el documento se queda en revisión para la casa.
 */
export async function revisarDocumento(docId: string): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    const { data: fila } = await sb
      .from("operator_documents")
      .select("id, operator_id, actividad, documento, archivo_path, estado, vence_at")
      .eq("id", docId)
      .maybeSingle();
    const f = fila as {
      id: string; operator_id: string; actividad: string | null; documento: string;
      archivo_path: string | null; estado: string; vence_at: string | null;
    } | null;
    if (!f || !f.archivo_path || f.documento === "csf" || f.estado !== "en_revision") return;

    const doc =
      f.actividad === null
        ? GENERALES.find((g) => g.slug === f.documento)
        : requisitosDe(f.actividad).propios.find((x) => x.slug === f.documento);
    if (!doc) return;

    const { data: op } = await sb
      .from("operators")
      .select("name, razon_social, legal")
      .eq("id", f.operator_id)
      .maybeSingle();
    const o = (op ?? {}) as { name?: string | null; razon_social?: string | null; legal?: { responsable?: string } | null };
    const nombres = [o.razon_social, o.name, o.legal?.responsable].filter((x): x is string => !!x?.trim());

    const ext = f.archivo_path.split(".").pop() ?? "";
    const tipo = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "jpg" ? "image/jpeg" : "image/heic";
    const { data: archivo, error: eDescarga } = await sb.storage.from(BUCKET).download(f.archivo_path);

    const at = new Date().toISOString();
    const leido = eDescarga || !archivo ? { error: "No se pudo abrir el archivo." } : await leer(await archivo.arrayBuffer(), tipo, doc, nombres);

    let analisis: RevisionIa;
    if ("error" in leido) {
      analisis = {
        v: 1, tipo: "revision", at, esLoQueSePide: null, legible: null, titular: null, coincideTitular: null,
        venceAt: null, alertas: [], resumen: null, veredicto: "dudoso", razones: [leido.error], error: leido.error,
      };
    } else {
      const v = veredicto(leido, {
        caduca: doc.vence,
        venceEscrita: f.vence_at?.slice(0, 10) ?? null,
        hoy: at.slice(0, 10),
        pideTitular: f.actividad === null && A_SU_NOMBRE.has(f.documento) && nombres.length > 0,
      });
      analisis = { v: 1, tipo: "revision", at, ...leido, ...v };
    }

    const cambios: Record<string, unknown> = { analisis };
    // La fecha se LEE del documento: si nadie la escribió, se toma la leída.
    if (doc.vence && !f.vence_at && analisis.venceAt) cambios.vence_at = analisis.venceAt;
    if (analisis.veredicto === "aprobado") {
      cambios.estado = "aprobado";
      cambios.revisado_at = at;
      cambios.revisado_por = REVISOR_AUTOMATICO;
      cambios.motivo = null;
    }
    // Sólo si sigue en revisión: si una persona ya decidió mientras leíamos,
    // su decisión manda.
    const { error } = await sb.from("operator_documents").update(cambios).eq("id", f.id).eq("estado", "en_revision");
    if (error) {
      console.error("revisarDocumento:", error.message);
      return;
    }
    if (analisis.veredicto === "aprobado" && f.actividad) await cerrarActividadSiCompleta(f.operator_id, f.actividad);
  } catch (e) {
    console.error("revisarDocumento:", e);
  }
}

/**
 * Lo que la operadora antes tenía que hacer con un botón y la casa con otro:
 *   · Con todos los documentos de la actividad subidos, la carpeta pasa SOLA a
 *     revisión (antes, «Mandar a revisión»: si no lo apretaba, nadie se
 *     enteraba de que ya había subido todo).
 *   · Con todos APROBADOS, la actividad se aprueba sola y se le avisa.
 * La casa sigue pudiendo devolverla o suspenderla.
 */
export async function cerrarActividadSiCompleta(operatorId: string, actividad: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  const [{ data: docs }, { data: act }] = await Promise.all([
    sb.from("operator_documents").select("documento, estado").eq("operator_id", operatorId).eq("actividad", actividad),
    sb.from("operator_activities").select("estado").eq("operator_id", operatorId).eq("actividad", actividad).maybeSingle(),
  ]);
  const estadoAct = (act as { estado?: string } | null)?.estado;
  if (estadoAct !== "incompleta" && estadoAct !== "en_revision") return;
  const porSlug = new Map(((docs ?? []) as { documento: string; estado: string }[]).map((d) => [d.documento, d.estado]));
  const propios = requisitosDe(actividad).propios;
  const subidos = propios.every((d) => porSlug.has(d.slug) && porSlug.get(d.slug) !== "rechazado");
  const aprobados = propios.every((d) => porSlug.get(d.slug) === "aprobado");
  const ahora = new Date().toISOString();

  if (aprobados) {
    const { data: hecha } = await sb
      .from("operator_activities")
      .update({ estado: "aprobada", resuelta_at: ahora, motivo: null, updated_at: ahora, ...(estadoAct === "incompleta" ? { enviada_at: ahora } : {}) })
      .eq("operator_id", operatorId)
      .eq("actividad", actividad)
      .in("estado", ["incompleta", "en_revision"])
      .select("actividad");
    if ((hecha ?? []).length) {
      const { data: o } = await sb.from("operators").select("email, name").eq("id", operatorId).maybeSingle();
      const r = o as { email: string | null; name: string | null } | null;
      if (r?.email) {
        await emailActividadAprobada(r.email, r.name, nombreDeActividad(actividad)).catch((e) =>
          console.error("aviso de actividad aprobada sola:", e),
        );
      }
    }
    return;
  }
  if (subidos && estadoAct === "incompleta") {
    await sb
      .from("operator_activities")
      .update({ estado: "en_revision", enviada_at: ahora, updated_at: ahora })
      .eq("operator_id", operatorId)
      .eq("actividad", actividad)
      .eq("estado", "incompleta");
  }
}

/** La línea que se le enseña a una persona sobre lo que leyó la revisión. */
export function resumenRevision(a: RevisionIa, estado: string): { tono: "ok" | "aviso" | "mal"; texto: string } {
  if (estado === "aprobado" && a.veredicto === "aprobado") {
    return { tono: "ok", texto: `Leído y aprobado solo${a.resumen ? `: ${a.resumen}` : "."}` };
  }
  if (a.veredicto === "dudoso") {
    return { tono: "aviso", texto: `Lo revisa una persona: ${a.razones.join(" ")}` };
  }
  return { tono: "ok", texto: a.resumen ?? "Leído." };
}
