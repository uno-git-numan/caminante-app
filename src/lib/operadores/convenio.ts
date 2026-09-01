import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// EL CONVENIO — qué versión hay que tener firmada hoy, y qué firmó cada quien.
//
// Tres reglas de negocio viven aquí y en ningún otro lado:
//
// 1. Un cambio MENOR no bloquea. Se avisa y se acepta al entrar. Bloquear la
//    venta de alguien por una corrección de redacción es una forma de perder
//    dinero propio.
// 2. Un cambio MAYOR se publica con anticipación (`vigente_desde`). Durante ese
//    plazo el operador sigue vendiendo con la versión vieja. Pasado el plazo sin
//    firmar, deja de vender lo NUEVO — pero lo ya vendido sigue operando. Nunca
//    se le cae una salida encima a un cliente por un tema de papeles.
// 3. Firmar una versión más nueva cubre las viejas. Por eso se compara por
//    `orden` y no por igualdad de texto.

export const DIAS_DE_AVISO = 30;

export type VersionConvenio = {
  version: string;
  orden: number;
  tipo: "menor" | "mayor";
  titulo: string;
  texto: string;
  hash: string;
  vigenteDesde: string;
  publicadaAt: string;
};

/** El sha-256 del texto EXACTO que se muestra. Es lo que cierra la discusión de «yo no firmé eso». */
export const hashDeTexto = (texto: string): string =>
  createHash("sha256").update(texto, "utf8").digest("hex");

export async function versionesConvenio(): Promise<VersionConvenio[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operator_agreement_versions")
    .select("version, orden, tipo, titulo, texto, hash, vigente_desde, publicada_at")
    .order("orden", { ascending: false });
  // Si la tabla todavía no existe (migración 0050 sin aplicar), esto NO revienta
  // la pantalla: devuelve vacío y el candado dice la verdad — que la casa aún no
  // publica ningún convenio.
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((v) => ({
    version: v.version as string,
    orden: Number(v.orden),
    tipo: v.tipo as "menor" | "mayor",
    titulo: v.titulo as string,
    texto: v.texto as string,
    hash: v.hash as string,
    vigenteDesde: v.vigente_desde as string,
    publicadaAt: v.publicada_at as string,
  }));
}

export type EstadoConvenio = {
  /** La que hay que tener firmada HOY para poder vender. Null = la casa no ha publicado ninguna. */
  exigida: VersionConvenio | null;
  /** La última publicada, exigible o no. Es la que se le muestra a quien va a firmar. */
  ultima: VersionConvenio | null;
  /** Una MAYOR publicada que todavía no es exigible: hay que avisarle, sin bloquear. */
  porVenir: VersionConvenio | null;
};

export function leerEstado(versiones: VersionConvenio[], ahora = new Date()): EstadoConvenio {
  const mayores = versiones.filter((v) => v.tipo === "mayor");
  const exigida = mayores.find((v) => new Date(v.vigenteDesde) <= ahora) ?? null;
  const porVenir = mayores.find((v) => new Date(v.vigenteDesde) > ahora) ?? null;
  return { exigida, ultima: versiones[0] ?? null, porVenir };
}

/** Cuántos días le quedan para firmar una versión que todavía no es exigible. */
export function diasParaFirmar(v: VersionConvenio, ahora = new Date()): number {
  const ms = new Date(v.vigenteDesde).getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/**
 * ¿Está al día? Se compara por `orden`: haber firmado algo más nuevo cubre lo viejo.
 *
 * Si la casa NO ha publicado convenio, esto devuelve `false` y —importante— el
 * pendiente es de la CASA, no del operador. Un candado que le echa la culpa a
 * quien no puede resolverlo es peor que no tenerlo.
 */
export function convenioAlDia(
  estado: EstadoConvenio,
  versionFirmada: string | null,
  versiones: VersionConvenio[],
): { alDia: boolean; toca: "casa" | "operadora"; detalle: string } {
  if (!estado.exigida) {
    return { alDia: false, toca: "casa", detalle: "La casa no ha publicado el convenio" };
  }
  const firmada = versionFirmada ? versiones.find((v) => v.version === versionFirmada) : null;
  if (!firmada) return { alDia: false, toca: "operadora", detalle: "Sin firmar" };
  if (firmada.orden >= estado.exigida.orden) {
    return { alDia: true, toca: "operadora", detalle: `Firmado · ${firmada.version}` };
  }
  return {
    alDia: false,
    toca: "operadora",
    detalle: `Firmó ${firmada.version}; se exige ${estado.exigida.version}`,
  };
}

export type FirmaConvenio = {
  operadorId: string;
  version: string;
  /** El hash de lo que se pintó en su pantalla. Se compara contra el de la versión. */
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
 * Registra la firma. Congela la comisión pactada y la identidad de la empresa:
 * `operators.commission_pct` se puede editar mañana; esta copia no.
 */
export async function firmarConvenio(f: FirmaConvenio): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!f.aceptado) return { ok: false, error: "Hay que aceptar el convenio." };
  if (!f.facultadesDeclaradas) {
    return { ok: false, error: "Falta declarar que puedes obligar a la empresa." };
  }
  if (!f.firmanteNombre.trim()) return { ok: false, error: "Falta el nombre de quien firma." };

  const sb = createSupabaseAdminClient();
  const { data: ver } = await sb
    .from("operator_agreement_versions")
    .select("version, hash")
    .eq("version", f.version)
    .maybeSingle();
  if (!ver) return { ok: false, error: "Esa versión del convenio no existe." };

  // Si el hash no coincide, lo que leyó no es lo que tenemos guardado. Eso no se
  // firma: se para y se avisa.
  if ((ver as { hash: string }).hash !== f.hashMostrado) {
    return { ok: false, error: "El documento cambió mientras lo leías. Vuelve a abrirlo." };
  }

  const { data: op } = await sb
    .from("operators")
    .select("commission_pct, comision_desde, razon_social, rfc, tipo_persona, legal")
    .eq("id", f.operadorId)
    .maybeSingle();
  if (!op) return { ok: false, error: "No encontramos la operadora." };
  const o = op as Record<string, unknown>;
  if (o.commission_pct == null) {
    // Firmar un convenio que no dice cuánto se cobra sería firmar en blanco.
    return { ok: false, error: "Falta definir la comisión antes de firmar." };
  }

  const { error } = await sb.from("operator_agreements").insert({
    operator_id: f.operadorId,
    version: f.version,
    doc_hash: f.hashMostrado,
    firmante_nombre: f.firmanteNombre.trim(),
    firmante_email: f.firmanteEmail.trim(),
    firmante_puesto: f.firmantePuesto?.trim() || null,
    facultades_declaradas: true,
    aceptado: true,
    comision_pct: o.commission_pct,
    comision_desde: o.comision_desde ?? null,
    entidad_snapshot: {
      razon_social: o.razon_social ?? null,
      rfc: o.rfc ?? null,
      tipo_persona: o.tipo_persona ?? null,
      legal: o.legal ?? null,
    },
    ip: f.ip ?? null,
    user_agent: f.userAgent ?? null,
  });
  // El índice único convierte un doble clic en un no-op, no en dos firmas.
  if (error) {
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
