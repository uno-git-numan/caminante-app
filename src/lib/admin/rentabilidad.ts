// La cascada de rentabilidad POR SALIDA.
//
//   Ingreso cobrado → − IVA neto → − Stripe → − Proveedores → = Utilidad
//
// Por SALIDA y no por experiencia, porque los costos fijos se pagan una vez por
// salida: agregado por experiencia, el punto de equilibrio deja de existir.
//
// Reglas que no son obvias y que si se equivocan nadie las nota:
//   · El ingreso va NETO DE REEMBOLSOS. Un cobro devuelto no es ingreso — pero
//     su comisión de Stripe SÍ se quedó cobrada (Stripe MX no la regresa), así
//     que el costo permanece. Cobrar 18 y devolver 1 no son 18 lugares.
//   · Los montos de `experience_costs` son SIN IVA (así se sembraron). Para
//     mostrar "lo que se pagó" hay que multiplicar por 1.16; para la utilidad
//     se usan sin IVA, porque el IVA se acredita aparte.
//   · El `buffer` cuenta como fijo para el equilibrio: hay que cubrirlo igual.
//   · `seats_taken` NO se usa: está en 0 en las salidas self-serve. El llenado
//     se cuenta sumando `num_people` de las reservas que apartan.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle, formatFechaCorta } from "@/lib/admin/queries";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import type { Experience } from "@/lib/experiences/types";

const IVA = 0.16;

export type CostoLinea = {
  concepto: string;
  tipo: "fijo" | "variable" | "buffer";
  montoSinIva: number;
  notas: string | null;
  /** Un costo en 0 no es un costo conocido: casi siempre es uno sin cotizar. */
  sinCotizar: boolean;
};

export type SalidaRentabilidad = {
  slotId: string;
  experienciaSlug: string;
  experienciaNombre: string;
  salidaLabel: string;
  startsAt: string | null;
  mes: string; // 'YYYY-MM' para agrupar

  // Llenado
  vendidos: number;
  cupo: number | null;
  equilibrio: number | null; // personas necesarias para cubrir los fijos

  // La cascada
  ingreso: number; // cobrado − reembolsado
  reembolsado: number;
  ivaTrasladado: number; // positivo; se resta
  ivaAcreditable: number; // positivo; se suma
  ivaNeto: number; // negativo = a cargo del SAT
  stripe: number; // comisión + su IVA
  stripeSinIva: number;
  proveedoresSinIva: number;
  proveedoresConIva: number;
  utilidad: number;

  costos: CostoLinea[];
  costosFijos: number; // fijo + buffer
  costosVariables: number;
  /** Hay costos en $0 sin cotizar: la utilidad está inflada y hay que decirlo. */
  costosIncompletos: boolean;
  /** No hay ni un costo cargado: no se puede hablar de utilidad. */
  sinCostos: boolean;
};

export async function fetchRentabilidad(): Promise<SalidaRentabilidad[]> {
  const sb = createSupabaseAdminClient();
  const [slots, exps, resvs, pays, costos] = (await Promise.all([
    sb.from("experience_slots").select("id, experience_id, label, starts_at, capacity_total, price_mxn"),
    sb.from("experiences").select("id, slug, data"),
    sb.from("reservations").select("id, slot_id, num_people, status, total_amount_mxn"),
    sb.from("payments").select("reservation_id, amount_mxn, status, stripe_fee_mxn, stripe_fee_tax_mxn, refunded_mxn"),
    sb.from("experience_costs").select("slot_id, concepto, tipo, monto_mxn, notas"),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    { id: string; experience_id: string; label: string | null; starts_at: string | null; capacity_total: number | null; price_mxn: number | null }[],
    { id: string; slug: string; data: Partial<Experience> | null }[],
    { id: string; slot_id: string | null; num_people: number; status: string; total_amount_mxn: number }[],
    { reservation_id: string; amount_mxn: number; status: string; stripe_fee_mxn: number | null; stripe_fee_tax_mxn: number | null; refunded_mxn: number | null }[],
    { slot_id: string | null; concepto: string; tipo: string; monto_mxn: number; notas: string | null }[],
  ];

  const eById = new Map(exps.map((e) => [e.id, e]));
  const resvBySlot = new Map<string, typeof resvs>();
  const slotByResv = new Map<string, string>();
  for (const r of resvs) {
    if (!r.slot_id) continue;
    slotByResv.set(r.id, r.slot_id);
    resvBySlot.set(r.slot_id, [...(resvBySlot.get(r.slot_id) || []), r]);
  }

  // Dinero por salida, leído de los PAGOS (no de total_amount_mxn: ese es lo
  // que se acordó, no lo que entró).
  const dinero = new Map<string, { cobrado: number; reembolsado: number; stripe: number; stripeSinIva: number }>();
  for (const p of pays) {
    if (p.status !== "paid") continue;
    const slot = slotByResv.get(p.reservation_id);
    if (!slot) continue;
    const acc = dinero.get(slot) || { cobrado: 0, reembolsado: 0, stripe: 0, stripeSinIva: 0 };
    acc.cobrado += Number(p.amount_mxn || 0);
    acc.reembolsado += Number(p.refunded_mxn || 0);
    acc.stripe += Number(p.stripe_fee_mxn || 0);
    acc.stripeSinIva += Number(p.stripe_fee_mxn || 0) - Number(p.stripe_fee_tax_mxn || 0);
    dinero.set(slot, acc);
  }

  const costosBySlot = new Map<string, typeof costos>();
  for (const c of costos) {
    if (!c.slot_id) continue;
    costosBySlot.set(c.slot_id, [...(costosBySlot.get(c.slot_id) || []), c]);
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;
  const out: SalidaRentabilidad[] = [];

  for (const s of slots) {
    const d = dinero.get(s.id);
    const cs = costosBySlot.get(s.id) || [];
    // Una salida sin dinero y sin costos no tiene nada que contar.
    if (!d && !cs.length) continue;

    const exp = eById.get(s.experience_id);
    const rs = (resvBySlot.get(s.id) || []).filter((r) => HOLDING_STATUSES.includes(r.status));
    const vendidos = rs.reduce((a, r) => a + (r.num_people || 0), 0);

    const cobrado = d?.cobrado || 0;
    const reembolsado = d?.reembolsado || 0;
    const ingreso = cobrado - reembolsado;
    const stripe = d?.stripe || 0;
    const stripeSinIva = d?.stripeSinIva || 0;

    const lineas: CostoLinea[] = cs.map((c) => ({
      concepto: c.concepto,
      tipo: (c.tipo === "variable" || c.tipo === "buffer" ? c.tipo : "fijo") as CostoLinea["tipo"],
      montoSinIva: Number(c.monto_mxn || 0),
      notas: c.notas,
      sinCotizar: Number(c.monto_mxn || 0) === 0,
    }));
    const provSinIva = lineas.reduce((a, l) => a + l.montoSinIva, 0);
    const fijos = lineas.filter((l) => l.tipo !== "variable").reduce((a, l) => a + l.montoSinIva, 0);
    const variables = lineas.filter((l) => l.tipo === "variable").reduce((a, l) => a + l.montoSinIva, 0);

    // IVA: se traslada sobre el ingreso y se acredita sobre lo que se pagó con
    // IVA (proveedores + la comisión de Stripe).
    const ivaTrasladado = r2((ingreso / (1 + IVA)) * IVA);
    const ivaAcreditable = r2((provSinIva + stripeSinIva) * IVA);
    const ivaNeto = r2(ivaAcreditable - ivaTrasladado);

    const utilidad = r2(ingreso / (1 + IVA) - provSinIva - stripeSinIva);

    // Punto de equilibrio: cuántas personas hacen falta para cubrir los fijos.
    // La contribución de cada cliente es su precio sin IVA menos lo variable
    // que trae consigo menos lo que se lleva Stripe por ese cobro.
    const precio = Number(s.price_mxn || 0) || (vendidos > 0 ? cobrado / vendidos : 0);
    const varPorPersona = vendidos > 0 ? variables / vendidos : 0;
    const stripePorPersona = precio > 0 ? precio * 0.036 + 3 : 0;
    const contribucion = precio / (1 + IVA) - varPorPersona - stripePorPersona;
    const equilibrio = contribucion > 0 && fijos > 0 ? Math.ceil(fijos / contribucion) : null;

    out.push({
      slotId: s.id,
      experienciaSlug: exp?.slug || "?",
      experienciaNombre: exp ? experienceTitle(exp.data, exp.slug) : "?",
      salidaLabel: s.label || formatFechaCorta(s.starts_at),
      startsAt: s.starts_at,
      mes: (s.starts_at || "").slice(0, 7),
      vendidos,
      cupo: s.capacity_total,
      equilibrio,
      ingreso: r2(ingreso),
      reembolsado: r2(reembolsado),
      ivaTrasladado,
      ivaAcreditable,
      ivaNeto,
      stripe: r2(stripe),
      stripeSinIva: r2(stripeSinIva),
      proveedoresSinIva: r2(provSinIva),
      proveedoresConIva: r2(provSinIva * (1 + IVA)),
      utilidad,
      costos: lineas,
      costosFijos: r2(fijos),
      costosVariables: r2(variables),
      costosIncompletos: lineas.some((l) => l.sinCotizar),
      sinCostos: lineas.length === 0,
    });
  }

  return out.sort((a, b) => (b.startsAt || "").localeCompare(a.startsAt || ""));
}
