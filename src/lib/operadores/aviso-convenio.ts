import "server-only";

// «TUS DOCUMENTOS YA ESTÁN APROBADOS: SIGUE LA FIRMA» — el disparador del
// correo del convenio.
//
// Hasta el 23 nov 2026 `emailConvenioPorFirmar` salía al aprobar la solicitud,
// junto con la bienvenida. Con el alta en cinco pasos (`pasos.ts`) el convenio
// es el cuarto, y pedir la firma el primer día contradecía el orden: se quitó
// de ahí y el correo se quedó sin nadie que lo mandara. Su momento natural es
// éste: el paso 03 se acaba de cerrar —constancia fiscal e identificación
// aprobadas— y el 04 sigue abierto.
//
// ⚠️ SALE EN LA TRANSICIÓN, NO EN EL ESTADO. «Expediente completo y sin firma»
// es verdad durante días; si eso bastara, cada documento aprobado después
// (una póliza, la credencial del guía) volvería a mandarlo. Sale sólo cuando
// el documento que ACABA de aprobarse es el que completa el arranque: antes
// no estaba completo, ahora sí. Por eso no hace falta guardar «ya se avisó»:
// la marca es la transición misma.
//
// Hay TRES lugares donde un documento pasa a aprobado, y los tres llaman aquí:
//   · `csf.ts`               — la constancia que el SAT confirmó se aprueba sola
//   · `revision-ia.ts`       — la revisión automática de lo demás
//   · `expediente-actions.ts` — la casa, a mano (`resolverDocumento`)
// Cada uno llama SÓLO si de verdad movió la fila a aprobado.
//
// ⚠️ «COMPLETO» NO TIENE REGLA PROPIA: lo dice `armarExpediente`, la misma
// función que pinta Mi alta y el tablero de la casa. Si este correo decidiera
// a su modo, un día le diría «ya están aprobados» a quien su panel le dice
// que falta algo.
//
// Lo que NO cubre, dicho para que no se descubra tarde: el arranque también
// puede completarse sin que se apruebe nada (elegir física o moral después de
// tener los dos documentos aprobados, o reemplazar un opcional rechazado). Ahí
// no hay aviso. Y si la operadora reemplaza un documento ya aprobado y se lo
// volvemos a aprobar sin haber firmado, el correo sale otra vez: es otra
// transición, y lo que dice sigue siendo cierto.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { momentoDeGeneral } from "./actividades";
import { diasParaFirmar, leerEstado, versionesConvenio, type VersionConvenio } from "./convenio";
import { emailConvenioPorFirmar } from "./emails";
import { armarExpediente, type TipoPersona } from "./expediente";

/** Las filas de `operator_documents` como las lee `armarExpediente`. */
type FilaDoc = Parameters<typeof armarExpediente>[1][number];

/** El documento que acaba de pasar a aprobado. */
export type Transicion = {
  operatorId: string;
  /** `null` = de Lo general. Los de arranque son todos generales. */
  actividad: string | null;
  documento: string;
  /** Cómo estaba antes de aprobarse (`en_revision`, o `rechazado` si la casa lo levantó). */
  estadoAnterior: string;
};

/** Sólo los de Lo general que se piden para vender pueden completar el arranque. */
export const esDeArranque = (t: Pick<Transicion, "actividad" | "documento">): boolean =>
  t.actividad === null && momentoDeGeneral(t.documento) === "arranque";

/**
 * ¿Esta aprobación es la que COMPLETA el expediente de arranque? Puro.
 *
 * `generales` son las filas de Lo general como quedaron DESPUÉS de aprobar. El
 * «antes» se reconstruye devolviéndole a ese documento el estado que tenía: así
 * la pregunta no depende de quién aprobó ni en qué orden llegaron los papeles.
 */
export function completaElArranque(
  t: Pick<Transicion, "actividad" | "documento" | "estadoAnterior">,
  generales: FilaDoc[],
  tipoPersona: TipoPersona,
): boolean {
  if (!esDeArranque(t)) return false;
  if (t.estadoAnterior === "aprobado") return false;
  // Sin actividades: el arranque sólo mira Lo general.
  const despues = armarExpediente([], generales, undefined, tipoPersona);
  if (!despues.completo) return false;
  const antes = armarExpediente(
    [],
    generales.map((f) => (f.actividad === null && f.documento === t.documento ? { ...f, estado: t.estadoAnterior } : f)),
    undefined,
    tipoPersona,
  );
  return !antes.completo;
}

/**
 * Qué convenio se le enseña, o `null` si la casa no ha publicado ninguno: un
 * correo que dice «firma tu convenio» cuando no hay convenio es peor que el
 * silencio. Es la ÚLTIMA publicada, la misma que pinta la pantalla de firma
 * (`datos-firma.ts`). Puro.
 */
export function convenioParaAvisar(
  versiones: VersionConvenio[],
  ahora = new Date(),
): { titulo: string; version: string; dias: number } | null {
  const { ultima } = leerEstado(versiones, ahora);
  if (!ultima) return null;
  return {
    titulo: ultima.titulo,
    version: ultima.version,
    dias: new Date(ultima.vigenteDesde) <= ahora ? 0 : diasParaFirmar(ultima, ahora),
  };
}

export type Aviso =
  | { enviado: true }
  | {
      enviado: false;
      porque:
        | "no-es-de-arranque"
        | "sin-operadora"
        | "la-casa"
        | "ya-firmo"
        | "sin-correo"
        | "no-completa-el-arranque"
        | "sin-convenio-publicado"
        | "no-salio"
        | "error";
    };

/**
 * Llamar justo después de que un documento pasó a aprobado. Manda «tus
 * documentos ya están aprobados: sigue la firma» si esa aprobación completó el
 * arranque y la operadora no ha firmado.
 *
 * Nunca lanza: la aprobación ya está guardada y es lo que manda. Un correo que
 * no sale se registra y no deshace nada.
 */
export async function avisarConvenioSiCompletaArranque(t: Transicion): Promise<Aviso> {
  // Antes de tocar la base: casi todo lo que se aprueba (pólizas, credenciales,
  // permisos) no es de arranque, y no tiene nada que preguntar aquí.
  if (!esDeArranque(t)) return { enviado: false, porque: "no-es-de-arranque" };
  try {
    const sb = createSupabaseAdminClient();
    const { data: op, error: eOp } = await sb
      .from("operators")
      .select("email, name, tipo_persona, convenio_firmado_at, es_la_casa")
      .eq("id", t.operatorId)
      .maybeSingle();
    if (eOp) throw new Error(eOp.message);
    const o = op as {
      email: string | null; name: string | null; tipo_persona: string | null;
      convenio_firmado_at: string | null; es_la_casa: boolean | null;
    } | null;
    if (!o) return { enviado: false, porque: "sin-operadora" };
    // La casa no firma convenio consigo misma.
    if (o.es_la_casa === true) return { enviado: false, porque: "la-casa" };
    if (o.convenio_firmado_at) return { enviado: false, porque: "ya-firmo" };
    if (!o.email?.trim()) return { enviado: false, porque: "sin-correo" };

    const { data: docs, error: eDocs } = await sb
      .from("operator_documents")
      .select("actividad, documento, estado, motivo, vence_at")
      .eq("operator_id", t.operatorId)
      .is("actividad", null);
    if (eDocs) throw new Error(eDocs.message);
    const tipo: TipoPersona = o.tipo_persona === "fisica" || o.tipo_persona === "moral" ? o.tipo_persona : null;
    if (!completaElArranque(t, (docs ?? []) as FilaDoc[], tipo)) {
      return { enviado: false, porque: "no-completa-el-arranque" };
    }

    const convenio = convenioParaAvisar(await versionesConvenio());
    if (!convenio) return { enviado: false, porque: "sin-convenio-publicado" };

    const salio = await emailConvenioPorFirmar(o.email.trim(), o.name, { ...convenio, documentosAprobados: true });
    if (!salio) {
      console.error("aviso del convenio: el correo NO salió para la operadora", t.operatorId);
      return { enviado: false, porque: "no-salio" };
    }
    return { enviado: true };
  } catch (e) {
    console.error("aviso del convenio:", e);
    return { enviado: false, porque: "error" };
  }
}
