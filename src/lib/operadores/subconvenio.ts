import "server-only";

// EL ANEXO POR ACTIVIDAD — quién lo firmó, de qué versión, y si sigue al día.
//
// Es `convenio.ts` un nivel más abajo, y la simetría es a propósito: mismas
// palabras, mismas reglas, mismo trato. Lo que cambia es la unidad —una firma
// por ACTIVIDAD— y de dónde sale el texto: el del convenio vive en la base
// porque lo redacta un abogado; el del anexo se arma del catálogo
// (`subconvenio-doc.ts`) para que no pueda contradecir al expediente.
//
// ⚠️ TODAVÍA NO ES CANDADO. Hasta que exista la pantalla donde el Operador
// firme, exigir el anexo para publicar dejaría a Kéntro y a Nomádika sin poder
// vender por un papel que nadie les puede presentar — el mismo candado
// inalcanzable que la 0050 vino a arreglar. `anexoAlDia()` ya dice la verdad;
// enchufarlo a `candado-actividad.ts` es el paso siguiente, con la pantalla.

import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVIDADES, requisitosDe } from "./actividades";
import { textoDelAnexo, versionDelAnexo } from "./subconvenio-doc";

export const hashDeTexto = (texto: string): string =>
  createHash("sha256").update(texto, "utf8").digest("hex");

export type AnexoFirmado = {
  actividad: string;
  version: string;
  firmadoAt: string;
  firmanteNombre: string;
};

export type EstadoAnexo = {
  actividad: string;
  /** La que habría que tener firmada hoy, calculada del catálogo. */
  versionVigente: string;
  /** Lo último que firmó, si algo. */
  firmado: AnexoFirmado | null;
  /** Firmó, pero de una versión anterior: cambió lo que se le exige. */
  desactualizado: boolean;
  alDia: boolean;
};

/** Lo que hay que mostrarle para que firme: el texto y su hash. */
export function documentoDelAnexo(actividad: string): { version: string; texto: string; hash: string } | null {
  const texto = textoDelAnexo(actividad);
  const version = versionDelAnexo(actividad);
  if (!texto || !version) return null;
  return { version, texto, hash: hashDeTexto(texto) };
}

/**
 * El estado del anexo de CADA actividad declarada por una operadora.
 *
 * Se recorre lo declarado, no el catálogo entero: preguntarle a alguien por el
 * anexo de buceo cuando nunca dijo que buceara sería inventarle un pendiente.
 */
export async function estadoDeAnexos(operatorId: string): Promise<EstadoAnexo[]> {
  const sb = createSupabaseAdminClient();
  const [{ data: acts }, { data: firmas }] = await Promise.all([
    sb.from("operator_activities").select("actividad").eq("operator_id", operatorId),
    sb
      .from("operator_activity_annexes")
      .select("actividad, version, firmado_at, firmante_nombre")
      .eq("operator_id", operatorId)
      .order("firmado_at", { ascending: false }),
  ]);

  // Si la 0059 todavía no se aplica, `firmas` viene null: se responde «nadie ha
  // firmado», que es la verdad, en vez de tirar la pantalla.
  const porActividad = new Map<string, AnexoFirmado>();
  for (const f of (firmas ?? []) as Record<string, string>[]) {
    if (!porActividad.has(f.actividad)) {
      porActividad.set(f.actividad, {
        actividad: f.actividad,
        version: f.version,
        firmadoAt: f.firmado_at,
        firmanteNombre: f.firmante_nombre,
      });
    }
  }

  return ((acts ?? []) as { actividad: string }[])
    .filter((a) => ACTIVIDADES.some((c) => c.slug === a.actividad))
    .map((a) => {
      const versionVigente = versionDelAnexo(a.actividad)!;
      const firmado = porActividad.get(a.actividad) ?? null;
      const desactualizado = !!firmado && firmado.version !== versionVigente;
      return { actividad: a.actividad, versionVigente, firmado, desactualizado, alDia: !!firmado && !desactualizado };
    });
}

/**
 * ¿Esta actividad tiene su anexo al día? La pregunta que hace el candado.
 *
 * ⚠️ `exigible` DISTINGUE «no firmó» DE «todavía no hay dónde firmar». Si la
 * 0059 no está aplicada, la tabla no existe y la consulta falla: tratar eso como
 * «no firmó» dejaría a las operadoras sin publicar por un papel que nadie les
 * puede presentar — el candado inalcanzable que la 0050 vino a arreglar. Ante la
 * duda, el candado no muerde.
 */
export async function anexoAlDia(
  operatorId: string,
  actividad: string,
): Promise<{ firmado: boolean; exigible: boolean }> {
  const version = versionDelAnexo(actividad);
  if (!version) return { firmado: false, exigible: false };
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operator_activity_annexes")
    .select("id")
    .eq("operator_id", operatorId)
    .eq("actividad", actividad)
    .eq("version", version)
    .maybeSingle();
  if (error) {
    // 42P01 = la tabla no existe. Cualquier otro error también se trata como
    // «no se puede exigir»: negar el paso por un fallo nuestro es peor.
    console.error("anexoAlDia:", error);
    return { firmado: false, exigible: false };
  }
  return { firmado: !!data, exigible: true };
}

export type FirmaAnexo = {
  operadorId: string;
  actividad: string;
  /** El hash de lo que se pintó en su pantalla. Se compara contra el nuestro. */
  hashMostrado: string;
  firmanteNombre: string;
  firmanteEmail: string;
  firmantePuesto?: string | null;
  facultadesDeclaradas: boolean;
  aceptado: boolean;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Registra la firma de un anexo.
 *
 * ⚠️ SE EXIGE HABER DECLARADO LA ACTIVIDAD. Firmar el anexo de algo que no
 * ofreces dejaría una firma huérfana que ninguna pantalla sabría pintar, y que
 * el caché del trigger no tocaría — un papel real apuntando a nada.
 */
export async function firmarAnexo(f: FirmaAnexo): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!f.aceptado) return { ok: false, error: "Hay que aceptar el anexo." };
  if (!f.facultadesDeclaradas) {
    return { ok: false, error: "Falta declarar que puedes obligar a la empresa." };
  }
  if (!f.firmanteNombre.trim()) return { ok: false, error: "Falta el nombre de quien firma." };

  const doc = documentoDelAnexo(f.actividad);
  if (!doc) return { ok: false, error: "Esa actividad no existe." };
  // Si el hash no coincide, lo que leyó no es lo que tenemos. Eso no se firma.
  if (doc.hash !== f.hashMostrado) {
    return { ok: false, error: "El documento cambió mientras lo leías. Vuelve a abrirlo." };
  }

  const sb = createSupabaseAdminClient();
  const { data: declarada } = await sb
    .from("operator_activities")
    .select("id")
    .eq("operator_id", f.operadorId)
    .eq("actividad", f.actividad)
    .maybeSingle();
  if (!declarada) return { ok: false, error: "Primero declara la actividad en tu expediente." };

  const { error } = await sb.from("operator_activity_annexes").insert({
    operator_id: f.operadorId,
    actividad: f.actividad,
    version: doc.version,
    doc_hash: doc.hash,
    firmante_nombre: f.firmanteNombre.trim(),
    firmante_email: f.firmanteEmail.trim(),
    firmante_puesto: f.firmantePuesto?.trim() || null,
    facultades_declaradas: true,
    aceptado: true,
    // Qué se le exigía HOY. Agregar un requisito mañana no reescribe esto.
    documentos_snapshot: {
      propios: requisitosDe(f.actividad).propios.map((d) => ({ slug: d.slug, nombre: d.nombre, vence: d.vence })),
      generales: requisitosDe(f.actividad).generales.map((d) => d.slug),
    },
    ip: f.ip ?? null,
    user_agent: f.userAgent ?? null,
  });
  if (error) {
    // 23505 = ya firmó esta versión. No es un error que valga la pena enseñar.
    if ((error as { code?: string }).code === "23505") return { ok: true };
    console.error("firmarAnexo:", error);
    return { ok: false, error: "No se pudo registrar la firma." };
  }
  return { ok: true };
}
