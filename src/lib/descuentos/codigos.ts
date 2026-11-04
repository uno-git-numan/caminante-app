import "server-only";

// CÓDIGOS DE DESCUENTO (0074). La casa los crea en Recursos; la persona lo
// teclea en /reservar y el checkout lo resuelve server-side.
//
// Reglas:
//   · El descuento aplica al VIAJE (personas × precio), no a los complementos.
//   · El monto lo resuelve el servidor contra el precio guardado; el código
//     sólo dice cuánto se perdona. Nunca se confía en un monto del cliente.
//   · `usos` sube en el webhook al confirmar el pago (usar_codigo_descuento),
//     no al cotizar ni al abrir Stripe: un carrito abandonado no gasta usos.
//   · La comisión se calcula sobre lo cobrado (regla del 27 ago 2026).
//   · Lo obsoleto se apaga (`activo = false`), no se borra: las reservas que
//     lo usaron lo apuntan por FK.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";

export type TipoDescuento = "porcentaje" | "monto";

export type CodigoDescuento = {
  id: string;
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  experienceId: string | null;
  experiencia: string | null;
  slotId: string | null;
  salida: string | null;
  usosMax: number | null;
  usos: number;
  vigenteDesde: string | null;
  vigenteHasta: string | null;
  activo: boolean;
  nota: string | null;
  createdAt: string;
};

export type CodigoResuelto =
  | { ok: true; id: string; codigo: string; descuentoMxn: number; etiqueta: string }
  | { ok: false; error: string };

/** «ander50» → «ANDER50». Lo que no cabe en el check de la tabla, no es código. */
export function normalizarCodigo(raw: unknown): string | null {
  const c = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9_-]{3,32}$/.test(c) ? c : null;
}

/** Cuánto se perdona sobre `baseMxn` (el viaje). Puro. Nunca deja menos de $10. */
export function descuentoDe(c: { tipo: TipoDescuento; valor: number }, baseMxn: number): number {
  if (!(baseMxn > 0)) return 0;
  const bruto = c.tipo === "porcentaje" ? baseMxn * (c.valor / 100) : c.valor;
  return Math.max(0, Math.min(Math.round(bruto), Math.round(baseMxn - 10)));
}

export function etiquetaDe(c: { tipo: TipoDescuento; valor: number }): string {
  return c.tipo === "porcentaje" ? `${c.valor}% de descuento` : `$${Math.round(c.valor).toLocaleString("en-US")} de descuento`;
}

const hoyCdmx = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

/**
 * Resuelve un código contra una compra concreta. Devuelve el descuento en pesos
 * o la razón, en palabras para la persona, de por qué no aplica.
 */
export async function resolverCodigo(
  sb: SupabaseClient,
  input: { codigo: unknown; experienceId: string; slotId: string | null; baseMxn: number },
): Promise<CodigoResuelto> {
  const codigo = normalizarCodigo(input.codigo);
  if (!codigo) return { ok: false, error: "Ese código no es válido." };
  const { data: c } = await sb
    .from("codigos_descuento")
    .select("id, codigo, tipo, valor, experience_id, slot_id, usos_max, usos, vigente_desde, vigente_hasta, activo")
    .eq("codigo", codigo)
    .maybeSingle();
  if (!c) return { ok: false, error: "Ese código no existe." };
  if (!c.activo) return { ok: false, error: "Ese código ya no está activo." };
  const hoy = hoyCdmx();
  if (c.vigente_desde && hoy < String(c.vigente_desde)) return { ok: false, error: "Ese código todavía no empieza." };
  if (c.vigente_hasta && hoy > String(c.vigente_hasta)) return { ok: false, error: "Ese código ya venció." };
  if (c.usos_max != null && Number(c.usos) >= Number(c.usos_max)) return { ok: false, error: "Ese código ya se usó todas las veces que podía." };
  if (c.experience_id && c.experience_id !== input.experienceId) return { ok: false, error: "Ese código es de otra experiencia." };
  if (c.slot_id && c.slot_id !== input.slotId) return { ok: false, error: "Ese código es de otra salida." };
  const d = { tipo: c.tipo as TipoDescuento, valor: Number(c.valor) };
  const descuentoMxn = descuentoDe(d, input.baseMxn);
  if (descuentoMxn <= 0) return { ok: false, error: "Ese código no aplica a este monto." };
  return { ok: true, id: c.id as string, codigo, descuentoMxn, etiqueta: etiquetaDe(d) };
}

/** Todos los códigos, para Recursos. Sólo la casa. */
export async function listarCodigos(): Promise<CodigoDescuento[]> {
  if (!(await isCurrentUserAdmin())) return [];
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("codigos_descuento")
    .select("id, codigo, tipo, valor, experience_id, slot_id, usos_max, usos, vigente_desde, vigente_hasta, activo, nota, created_at")
    .order("activo", { ascending: false })
    .order("created_at", { ascending: false });
  const filas = (data ?? []) as {
    id: string; codigo: string; tipo: TipoDescuento; valor: number; experience_id: string | null; slot_id: string | null;
    usos_max: number | null; usos: number; vigente_desde: string | null; vigente_hasta: string | null; activo: boolean; nota: string | null; created_at: string;
  }[];
  const expIds = Array.from(new Set(filas.map((f) => f.experience_id).filter(Boolean))) as string[];
  const slotIds = Array.from(new Set(filas.map((f) => f.slot_id).filter(Boolean))) as string[];
  const [{ data: exps }, { data: slots }] = await Promise.all([
    expIds.length ? sb.from("experiences").select("id, slug, data").in("id", expIds) : Promise.resolve({ data: [] as { id: string; slug: string; data: unknown }[] }),
    slotIds.length ? sb.from("experience_slots").select("id, label").in("id", slotIds) : Promise.resolve({ data: [] as { id: string; label: string | null }[] }),
  ]);
  const nombreExp = new Map((exps ?? []).map((e) => [e.id as string, experienceTitle((e.data ?? null) as Partial<Experience> | null, e.slug as string)]));
  const nombreSlot = new Map((slots ?? []).map((s) => [s.id as string, (s.label as string | null) ?? ""]));
  return filas.map((f) => ({
    id: f.id,
    codigo: f.codigo,
    tipo: f.tipo,
    valor: Number(f.valor),
    experienceId: f.experience_id,
    experiencia: f.experience_id ? nombreExp.get(f.experience_id) ?? null : null,
    slotId: f.slot_id,
    salida: f.slot_id ? nombreSlot.get(f.slot_id) ?? null : null,
    usosMax: f.usos_max,
    usos: Number(f.usos) || 0,
    vigenteDesde: f.vigente_desde,
    vigenteHasta: f.vigente_hasta,
    activo: f.activo,
    nota: f.nota,
    createdAt: f.created_at,
  }));
}
