import "server-only";

// CÓDIGOS DE DESCUENTO (0074). Cada SALIDA tiene los suyos: se crean desde su
// cápsula en Salidas (Luis, 4 nov 2026: «cada salida puntual tiene su código
// individual», no un catálogo en Recursos); la persona lo teclea en /reservar
// y el checkout lo resuelve server-side.
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

export type TipoDescuento = "porcentaje" | "monto";

export type CodigoDescuento = {
  id: string;
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  slotId: string;
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

/** Los códigos de cada salida, para sus cápsulas. Activos primero, luego los más nuevos. */
export async function codigosPorSalida(sb: SupabaseClient, slotIds: string[]): Promise<Map<string, CodigoDescuento[]>> {
  const out = new Map<string, CodigoDescuento[]>();
  if (!slotIds.length) return out;
  const { data } = await sb
    .from("codigos_descuento")
    .select("id, codigo, tipo, valor, slot_id, usos_max, usos, vigente_desde, vigente_hasta, activo, nota, created_at")
    .in("slot_id", slotIds)
    .order("activo", { ascending: false })
    .order("created_at", { ascending: false });
  for (const f of (data ?? []) as {
    id: string; codigo: string; tipo: TipoDescuento; valor: number; slot_id: string;
    usos_max: number | null; usos: number; vigente_desde: string | null; vigente_hasta: string | null; activo: boolean; nota: string | null; created_at: string;
  }[]) {
    const c: CodigoDescuento = {
      id: f.id,
      codigo: f.codigo,
      tipo: f.tipo,
      valor: Number(f.valor),
      slotId: f.slot_id,
      usosMax: f.usos_max,
      usos: Number(f.usos) || 0,
      vigenteDesde: f.vigente_desde,
      vigenteHasta: f.vigente_hasta,
      activo: f.activo,
      nota: f.nota,
      createdAt: f.created_at,
    };
    out.set(f.slot_id, [...(out.get(f.slot_id) ?? []), c]);
  }
  return out;
}
