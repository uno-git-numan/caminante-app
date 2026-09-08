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
//   · El `buffer` cuenta como fijo para el equilibrio: hay que cubrirlo igual
//     MIENTRAS la salida no se haya ido. Cuando ya pasó y nadie capturó un
//     costo después de la fecha, el buffer no se usó y se vuelve UTILIDAD
//     (regla de Luis, 11 ago). Ver `bufferLiberado` abajo.
//   · `seats_taken` NO se usa: está en 0 en las salidas self-serve. El llenado
//     se cuenta sumando `num_people` de las reservas que apartan.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle, type LedgerLinea } from "@/lib/admin/queries";
import { cdmxDay, formatDiaMes, formatFechaCorta, metodoLabel } from "@/lib/admin/formato";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import type { Experience } from "@/lib/experiences/types";
import { cabezasDe, costoDeLinea, type Cortesia, type LineaCosto, type Modo } from "./costeo";

/** Una fila cruda de `experience_costs`, con todo lo que la 0049 y la 0057 agregaron. */
type CostoRow = {
  slot_id: string | null;
  experience_id: string;
  concepto: string;
  tipo: string;
  monto_mxn: number;
  notas: string | null;
  created_at: string;
  modo: Modo | null;
  tarifa_mxn: number | null;
  escalones: { desde: number; monto: number }[] | null;
  tramos: { desde: number; tarifa: number }[] | null;
  porcentaje: number | null;
  proporcion: number | null;
};
type CortesiaRow = { rol?: string; cuantas?: number; descuento_pct?: number };

/**
 * ⚠️ ESTA FUNCIÓN ES LA QUE FALTABA, Y SU AUSENCIA NO SE VEÍA.
 *
 * La 0049 agregó modos de costo (`por_persona`, `desde_personas`, `porcentaje`)
 * y su CHECK obliga a `monto_mxn = 0` en todos ellos — el monto real se deriva.
 * Pero aquí se sumaba `monto_mxn` a secas, así que TODO costo que no fuera
 * `unico` entraba como cero: la utilidad de esa salida salía inflada por el
 * costo completo, y encima la línea se marcaba «sin cotizar» estando cotizada.
 * Ya había una fila viva así (Ecotravel · travesía 7 días).
 *
 * Ahora el monto sale del MISMO motor que usa el cotizador. Una sola aritmética
 * para lo que se planea y para lo que se reporta.
 */
function montoDeFila(c: CostoRow, ctx: { clientes: number; cortesias: Cortesia[] }): number {
  const l: LineaCosto = {
    concepto: c.concepto,
    tipo: (c.tipo === "variable" || c.tipo === "buffer" ? c.tipo : "fijo") as LineaCosto["tipo"],
    modo: c.modo ?? "unico",
    montoMxn: Number(c.monto_mxn || 0),
    tarifaMxn: c.tarifa_mxn,
    escalones: c.escalones,
    tramos: c.tramos,
    porcentaje: c.porcentaje,
    proporcion: c.proporcion,
  };
  return costoDeLinea(l, ctx);
}

/** Un costo está sin cotizar cuando el dato de SU modo está vacío, no cuando monto_mxn es 0. */
function sinCotizar(c: CostoRow): boolean {
  switch (c.modo ?? "unico") {
    case "por_persona":
      return !Number(c.tarifa_mxn || 0);
    case "tarifa_por_tramo":
      return !(c.tramos ?? []).some((t) => Number(t.tarifa || 0) > 0);
    case "desde_personas":
      return !(c.escalones ?? []).some((e) => Number(e.monto || 0) > 0);
    case "porcentaje":
      return !Number(c.porcentaje || 0);
    default:
      return !Number(c.monto_mxn || 0);
  }
}

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
  /**
   * El buffer se liberó: la salida ya se fue y no se capturó ningún costo
   * después de la fecha, así que ese colchón no se gastó y es ganancia.
   */
  bufferLiberado: number;

  /**
   * Los pagos de ESTA salida (pagados, reembolsados y pendientes).
   *
   * Viven aquí y no en una lista global (Luis, 11 ago): un ledger plano de
   * cincuenta cobros no dice de quién es cada peso. Se incluyen los
   * reembolsados porque la historia del dinero de una salida no se entiende
   * viendo solo lo que entró.
   */
  pagos: LedgerLinea[];
};

export async function fetchRentabilidad(): Promise<SalidaRentabilidad[]> {
  const sb = createSupabaseAdminClient();
  const [slots, exps, resvs, pays, costos] = (await Promise.all([
    sb.from("experience_slots").select("id, experience_id, label, starts_at, capacity_total, price_mxn"),
    sb.from("experiences").select("id, slug, data, cabezas_cortesia"),
    sb.from("reservations").select("id, slot_id, num_people, status, total_amount_mxn"),
    sb
      .from("payments")
      .select(
        "reservation_id, contact_id, amount_mxn, status, method, paid_at, created_at, stripe_fee_mxn, stripe_fee_tax_mxn, refunded_mxn, referencia, comprobante_url",
      ),
    sb
      .from("experience_costs")
      .select(
        "slot_id, experience_id, concepto, tipo, monto_mxn, notas, created_at, modo, tarifa_mxn, escalones, tramos, porcentaje, proporcion",
      ),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    { id: string; experience_id: string; label: string | null; starts_at: string | null; capacity_total: number | null; price_mxn: number | null }[],
    { id: string; slug: string; data: Partial<Experience> | null; cabezas_cortesia: CortesiaRow[] | null }[],
    { id: string; slot_id: string | null; num_people: number; status: string; total_amount_mxn: number }[],
    {
      reservation_id: string;
      contact_id: string | null;
      amount_mxn: number;
      status: string;
      method: string | null;
      paid_at: string | null;
      created_at: string | null;
      stripe_fee_mxn: number | null;
      stripe_fee_tax_mxn: number | null;
      refunded_mxn: number | null;
      referencia: string | null;
      comprobante_url: string | null;
    }[],
    CostoRow[],
  ];

  const { data: contactRows } = await sb.from("contacts").select("id, full_name, email");
  const cById = new Map(
    ((contactRows || []) as { id: string; full_name: string | null; email: string | null }[]).map(
      (c) => [c.id, c.full_name || c.email || "—"],
    ),
  );

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

  // Los pagos de cada salida, del más reciente al más viejo.
  const pagosBySlot = new Map<string, LedgerLinea[]>();
  for (const p of [...pays].sort((a, b) =>
    (b.paid_at || b.created_at || "").localeCompare(a.paid_at || a.created_at || ""),
  )) {
    const slot = slotByResv.get(p.reservation_id);
    if (!slot) continue; // pago sin salida: lo reporta `fetchDinero().huerfanos`
    pagosBySlot.set(slot, [
      ...(pagosBySlot.get(slot) || []),
      {
        fecha: formatDiaMes(p.paid_at || p.created_at),
        persona: (p.contact_id && cById.get(p.contact_id)) || "—",
        metodo: metodoLabel(p.method),
        monto: Number(p.amount_mxn || 0),
        estado: p.status,
        referencia: p.referencia || null,
        comprobantePath: p.comprobante_url || null,
      },
    ]);
  }

  // ⚠️ UN COSTO SIN `slot_id` ES DE LA EXPERIENCIA, NO ES BASURA.
  //
  // Antes se descartaba con un `continue` y por eso desaparecía de la cascada:
  // el costo de Ecotravel de la travesía ($23,350 por persona) no aparecía en
  // ninguna salida, y esas fechas se leían como «sin costear» teniendo su costo
  // principal cargado. Un costo de experiencia aplica a CADA una de sus fechas
  // —cada salida lo paga— así que se reparte a todas, no se promedia.
  const costosBySlot = new Map<string, typeof costos>();
  const costosByExp = new Map<string, typeof costos>();
  for (const c of costos) {
    if (c.slot_id) costosBySlot.set(c.slot_id, [...(costosBySlot.get(c.slot_id) || []), c]);
    else if (c.experience_id)
      costosByExp.set(c.experience_id, [...(costosByExp.get(c.experience_id) || []), c]);
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;
  const hoy = cdmxDay(new Date());
  const out: SalidaRentabilidad[] = [];

  for (const s of slots) {
    const d = dinero.get(s.id);
    const cs = [...(costosByExp.get(s.experience_id) || []), ...(costosBySlot.get(s.id) || [])];
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

    // Las cortesías salen de la EXPERIENCIA: los guías van en todas sus fechas.
    const cortesias: Cortesia[] = ((exp?.cabezas_cortesia ?? []) as CortesiaRow[]).map((k) => ({
      rol: String(k.rol ?? "cortesía"),
      cuantas: Number(k.cuantas ?? 0),
      descuentoPct: Number(k.descuento_pct ?? 0),
    }));
    const ctxCosteo = { clientes: vendidos, cortesias };

    // El porcentaje (buffer) va sobre los DEMÁS, y por eso se resuelve en dos
    // pasos: si entrara en la misma pasada, dos buffers se comerían el uno al
    // otro y el total dependería del orden de las filas.
    const noPct = cs.filter((c) => (c.modo ?? "unico") !== "porcentaje");
    const basePct = noPct.reduce((a, c) => a + montoDeFila(c, ctxCosteo), 0);

    // ¿Se liberó el buffer? (regla de Luis, 11 ago, opción A)
    //
    // El buffer del 5% es un colchón para imprevistos. Mientras la salida no se
    // ha ido hay que cubrirlo — cuenta como costo fijo y sube el equilibrio.
    // Pero si la salida YA PASÓ y nadie capturó un costo después de la fecha,
    // el imprevisto nunca ocurrió: ese dinero no salió y es utilidad.
    //
    // ⚠️ La señal es «nadie agregó un costo después de la salida». Es una
    // inferencia, no un dato: si un imprevisto se captura ANTES de viajar o
    // nunca se captura, el sistema no se entera. Luis lo eligió así a propósito
    // («por ahora, hazlo con A») porque no quiere un paso más al cerrar; el día
    // que haya un cierre explícito de salida, esto se reemplaza por el dato.
    const yaSeFue = !!s.starts_at && cdmxDay(s.starts_at) < hoy;
    // El corte NO puede ser solo la fecha de salida. Los costos de las salidas
    // viejas se capturaron el 11 de agosto, o sea DESPUÉS del viaje, y con ese
    // corte toda salida pasada parecía haber tenido un imprevisto. El corte
    // real es «después del viaje Y después de que esta salida se costeó»: un
    // gasto sorpresa se anota más tarde que el costeo, una captura retroactiva
    // llega toda junta.
    const primeraCaptura = cs.reduce(
      (min, c) => (c.created_at && (!min || c.created_at < min) ? c.created_at : min),
      "" as string,
    );
    const corte =
      s.starts_at && primeraCaptura
        ? s.starts_at > primeraCaptura
          ? s.starts_at
          : primeraCaptura
        : s.starts_at || primeraCaptura;
    const huboGastoDespues = !!corte && cs.some((c) => c.created_at && c.created_at > corte);
    const liberaBuffer = yaSeFue && !huboGastoDespues;
    // ⚠️ El buffer también se deriva: si es modo `porcentaje`, su `monto_mxn` es
    // 0 por CHECK y liberarlo por ese valor no liberaba nada.
    const bufferLiberado = liberaBuffer
      ? cs
          .filter((c) => c.tipo === "buffer")
          .reduce(
            (a, c) =>
              a +
              ((c.modo ?? "unico") === "porcentaje"
                ? Math.round(basePct * (Number(c.porcentaje || 0) / 100) * 100) / 100
                : montoDeFila(c, ctxCosteo)),
            0,
          )
      : 0;

    const lineas: CostoLinea[] = cs.map((c) => ({
      concepto: c.concepto,
      tipo: (c.tipo === "variable" || c.tipo === "buffer" ? c.tipo : "fijo") as CostoLinea["tipo"],
      montoSinIva:
        (c.modo ?? "unico") === "porcentaje"
          ? Math.round(basePct * (Number(c.porcentaje || 0) / 100) * 100) / 100
          : montoDeFila(c, ctxCosteo),
      notas: c.notas,
      sinCotizar: sinCotizar(c),
    }));
    const provSinIva = lineas.reduce((a, l) => a + l.montoSinIva, 0) - bufferLiberado;
    const fijos =
      lineas.filter((l) => l.tipo !== "variable").reduce((a, l) => a + l.montoSinIva, 0) -
      bufferLiberado;
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
      bufferLiberado: r2(bufferLiberado),
      costosIncompletos: lineas.some((l) => l.sinCotizar),
      sinCostos: lineas.length === 0,
      pagos: pagosBySlot.get(s.id) || [],
    });
  }

  return out.sort((a, b) => (b.startsAt || "").localeCompare(a.startsAt || ""));
}
