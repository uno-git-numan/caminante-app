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
import { armarExpediente, type EstadoActividad } from "./expediente";

/**
 * `sin_arranque` (23 nov 2026): falta el expediente de arranque —constancia
 * fiscal e identificación—. `no_aprobada` quedó sólo para la actividad
 * SUSPENDIDA: desde el convenio v3.5 la carpeta de la actividad (credencial
 * del guía, permisos) ya no detiene la publicación, detiene la salida.
 */
export type MotivoCandado = "sin_actividad" | "no_declarada" | "no_aprobada" | "sin_anexo" | "sin_arranque";

/** Una dispensa vigente: el candado se abre, pero se dice en voz alta. */
export type Dispensa = { motivo: string; autorizadaPor: string; venceAt: string };

export type CandadoActividad =
  | { ok: true; dispensa?: Dispensa }
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

async function dispensaVigente(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  operatorId: string,
  actividad: string,
): Promise<Dispensa | null> {
  const { data, error } = await sb
    .from("operator_activity_dispensas")
    .select("motivo, autorizada_por, vence_at")
    .eq("operator_id", operatorId)
    .eq("actividad", actividad)
    .is("revocada_at", null)
    .gt("vence_at", new Date().toISOString())
    .order("vence_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // ⚠️ ANTE LA DUDA, NO HAY DISPENSA. Mismo criterio que `esLaCasa`: si no se
  // pudo leer, el candado muerde. Abrirlo por un error de lectura sería dejar
  // vender sin expediente por un parpadeo de la base.
  if (error || !data) return null;
  const r = data as { motivo: string; autorizada_por: string; vence_at: string };
  return { motivo: r.motivo, autorizadaPor: r.autorizada_por, venceAt: r.vence_at };
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

  // La dispensa abre cualquiera de los candados de abajo (menos la suspensión
  // no: una dispensa vigente sobre una actividad suspendida sigue valiendo,
  // como hasta hoy; quien suspende revoca la dispensa).
  const conDispensa = async (): Promise<CandadoActividad | null> => {
    const d = await dispensaVigente(sb, operatorId, slug);
    return d ? { ok: true, dispensa: d } : null;
  };

  if (!estado) {
    return (
      (await conDispensa()) ?? {
        ok: false,
        motivo: "no_declarada",
        actividad: slug,
        nombre,
        estado: null,
        documentos,
        mensaje:
          `Todavía no declaras ${nombre.toLowerCase()}. Declárala en tu expediente y firma su anexo: ` +
          `con eso y tu expediente de arranque ya puedes publicar esta experiencia.`,
      }
    );
  }

  if (estado === "suspendida") {
    return (
      (await conDispensa()) ?? {
        ok: false,
        motivo: "no_aprobada",
        actividad: slug,
        nombre,
        estado,
        documentos,
        mensaje:
          `Tu expediente de ${nombre.toLowerCase()} está suspendido, así que esa actividad no puede vender ` +
          `hasta que se resuelva. Escríbenos y lo vemos.`,
      }
    );
  }

  // ── EL EXPEDIENTE DE ARRANQUE (convenio v3.5, Sexta c) y Anexo B) ───────────
  // Para publicar y vender bastan la constancia fiscal y la identificación,
  // aprobadas y vigentes. Lo decide `armarExpediente`, la misma función que
  // pinta Mi alta: el candado no tiene su propia idea de «arranque».
  const arranque = await arranqueDe(sb, operatorId);
  if (!arranque.listo) {
    return (
      (await conDispensa()) ?? {
        ok: false,
        motivo: "sin_arranque",
        actividad: slug,
        nombre,
        estado,
        documentos: arranque.faltan.length,
        mensaje: arranque.faltan.length
          ? `Para publicar falta en tu expediente: ${arranque.faltan.join(" y ")}. ` +
            `Lo demás (póliza de responsabilidad civil, credencial del guía, permisos) se entrega antes de tu primera salida.`
          : `Ya entregaste lo necesario para publicar y lo estamos revisando. En cuanto quede aprobado ` +
            `puedes publicar; mientras tanto tu borrador se queda guardado, completo.`,
      }
    );
  }

  const anexo = await anexoAlDia(operatorId, slug);
  if (anexo.exigible && !anexo.firmado) {
    return (
      (await conDispensa()) ?? {
        ok: false,
        motivo: "sin_anexo",
        actividad: slug,
        nombre,
        estado,
        documentos,
        mensaje:
          `Falta firmar el anexo de ${nombre.toLowerCase()} — el documento que dice qué se te pide ` +
          `para esta actividad en particular y cuándo. Son dos minutos.`,
      }
    );
  }
  return { ok: true };
}

/**
 * El expediente de arranque de una operadora: ¿está aprobado?, y si no, qué le
 * falta, con nombre. Ante un error de lectura NO está listo: el candado muerde.
 */
async function arranqueDe(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  operatorId: string,
): Promise<{ listo: boolean; faltan: string[] }> {
  const [{ data: docs, error: e1 }, { data: op, error: e2 }] = await Promise.all([
    sb
      .from("operator_documents")
      .select("actividad, documento, estado, motivo, vence_at")
      .eq("operator_id", operatorId)
      .is("actividad", null),
    sb.from("operators").select("tipo_persona").eq("id", operatorId).maybeSingle(),
  ]);
  if (e1 || e2) {
    console.error("arranqueDe:", e1 ?? e2);
    return { listo: false, faltan: [] };
  }
  const tipo = (op as { tipo_persona?: string } | null)?.tipo_persona;
  const e = armarExpediente(
    [],
    (docs ?? []) as Parameters<typeof armarExpediente>[1],
    undefined,
    tipo === "fisica" || tipo === "moral" ? tipo : null,
  );
  const faltan = e.generales
    .filter((d) => d.momento === "arranque" && !d.opcional)
    .filter((d) => d.estado === "falta" || d.estado === "rechazado" || (d.diasParaVencer !== null && d.diasParaVencer < 0))
    .map((d) => d.nombre.toLowerCase());
  if (!e.tipoPersona) faltan.unshift("decir si eres persona física o moral");
  return { listo: e.completo, faltan };
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
