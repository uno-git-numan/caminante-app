// LOS DATOS FISCALES PRIVADOS DE LA OPERADORA (0081, 11 nov 2026).
//
// CURP, domicilio fiscal, banco y CLABE: lo que pide la informativa mensual de
// plataformas (LIVA 18-J III, decisión D4 de legal) y Stripe no nos devuelve.
// Viven en `operator_fiscal_privado`, con RLS y sin políticas: sólo el
// service-role. Las pantallas nunca reciben la CLABE ni la CURP completas.
//
// De dónde sale cada uno: CURP y domicilio de la constancia que el SAT
// confirmó (csf.ts llama a `guardarDeConstancia`); la CLABE se captura una vez
// y el banco sale de ella (lib/fiscal/clabe.ts).

import type { SupabaseClient } from "@supabase/supabase-js";
import { clabeEnmascarada, validarClabe } from "@/lib/fiscal/clabe";

export type Domicilio = {
  calle: string | null;
  numeroExterior: string | null;
  numeroInterior: string | null;
  colonia: string | null;
  localidad: string | null;
  municipio: string | null;
  estado: string | null;
  codigoPostal: string | null;
};

const CURP = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/;

/**
 * La CURP leída, sólo si es una CURP bien formada Y es de ese RFC. En una
 * persona física, los 10 primeros caracteres del RFC (letras + fecha de
 * nacimiento) son los de su CURP: si no coinciden, la lectura se equivocó y
 * NO se guarda.
 */
export function curpDeRfc(curp: string | null | undefined, rfc: string | null | undefined): string | null {
  const c = (curp ?? "").toUpperCase().replace(/\s+/g, "");
  const r = (rfc ?? "").toUpperCase().replace(/\s+/g, "");
  if (!CURP.test(c) || r.length !== 13) return null;
  return c.slice(0, 10) === r.slice(0, 10) ? c : null;
}

/** Un domicilio con al menos calle, municipio o estado y el CP de 5 dígitos. */
export function domicilioUtil(d: Partial<Domicilio> | null | undefined): Domicilio | null {
  if (!d) return null;
  const t = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const dom: Domicilio = {
    calle: t(d.calle),
    numeroExterior: t(d.numeroExterior),
    numeroInterior: t(d.numeroInterior),
    colonia: t(d.colonia),
    localidad: t(d.localidad),
    municipio: t(d.municipio),
    estado: t(d.estado),
    codigoPostal: /^\d{5}$/.test(t(d.codigoPostal) ?? "") ? t(d.codigoPostal) : null,
  };
  if (!dom.codigoPostal || !(dom.calle || dom.municipio || dom.estado)) return null;
  return dom;
}

/** Lo que la constancia confirmada aporta. Nunca lanza; dice si no se pudo. */
export async function guardarDeConstancia(
  sb: SupabaseClient,
  operatorId: string,
  datos: { curp: string | null; domicilio: Domicilio | null; documentoId: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!datos.curp && !datos.domicilio) return { ok: true };
  const { error } = await sb.from("operator_fiscal_privado").upsert(
    {
      operator_id: operatorId,
      ...(datos.curp ? { curp: datos.curp } : {}),
      ...(datos.domicilio ? { domicilio_fiscal: datos.domicilio } : {}),
      csf_documento_id: datos.documentoId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "operator_id" },
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Guarda la CLABE validada y su banco. `bancoTecleado` sólo cuenta si el prefijo no está en el listado. */
export async function guardarClabe(
  sb: SupabaseClient,
  operatorId: string,
  entrada: string,
  bancoTecleado?: string | null,
): Promise<{ ok: true; banco: string } | { ok: false; error: string; pideBanco?: boolean }> {
  const v = validarClabe(entrada);
  if (!v.ok) return { ok: false, error: v.porque };
  const banco = v.banco ?? (bancoTecleado ?? "").trim();
  if (!banco) {
    return { ok: false, pideBanco: true, error: `No reconocemos el banco ${v.clave}. Escribe el nombre de tu banco.` };
  }
  const ahora = new Date().toISOString();
  const { error } = await sb
    .from("operator_fiscal_privado")
    .upsert({ operator_id: operatorId, clabe: v.clabe, banco, clabe_at: ahora, updated_at: ahora }, { onConflict: "operator_id" });
  return error ? { ok: false, error: error.message } : { ok: true, banco };
}

/** Lo que una pantalla puede ver: si está y de dónde, nunca el dato completo. */
export type FiscalPrivadoPanel = {
  curp: boolean;
  domicilio: string | null;
  clabe: string | null;
  banco: string | null;
};

export async function fiscalPrivadoParaPanel(
  sb: SupabaseClient,
  operatorIds: string[],
): Promise<Map<string, FiscalPrivadoPanel>> {
  const m = new Map<string, FiscalPrivadoPanel>();
  if (!operatorIds.length) return m;
  const { data, error } = await sb
    .from("operator_fiscal_privado")
    .select("operator_id, curp, domicilio_fiscal, clabe, banco")
    .in("operator_id", operatorIds);
  // Sin la 0081 aplicada la tabla no existe: el panel sigue, sin estos datos.
  if (error) return m;
  for (const f of (data ?? []) as { operator_id: string; curp: string | null; domicilio_fiscal: Domicilio | null; clabe: string | null; banco: string | null }[]) {
    const d = f.domicilio_fiscal;
    m.set(f.operator_id, {
      curp: Boolean(f.curp),
      domicilio: d ? [d.municipio, d.estado, d.codigoPostal].filter(Boolean).join(", ") : null,
      clabe: f.clabe ? clabeEnmascarada(f.clabe) : null,
      banco: f.banco,
    });
  }
  return m;
}
