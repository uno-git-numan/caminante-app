import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// PANORAMA DE LA PLATAFORMA — las dos cifras que no son la misma cosa.
//
// Caminante es la plataforma; NUMAN es su operadora propia. Lo que corre por la
// plataforma es de los operadores: entra, se les paga y sale. Lo único que la
// casa gana es la COMISIÓN. La distancia entre esas dos cifras es el negocio
// entero, y toda esta pantalla existe para que nadie las confunda.
//
// ⚠️ LA REGLA QUE SOSTIENE EL ARCHIVO
//
// La comisión de una venta es la que se CONGELÓ al cobrar (0016), no la que
// tiene hoy la operadora en su ficha. Aquí no se multiplica jamás
// `operators.commission_pct` por ventas pasadas.
//
// Es la diferencia entre reportar y adivinar. Si mañana renegocias con alguien
// de 20% a 15%, recalcular el histórico con el 15 cambiaría lo que ya se cobró:
// la pantalla seguiría cuadrando consigo misma y dejaría de cuadrar con el
// banco. Y en el arranque el error es al revés y peor — multiplicar el 20% por
// ventas anteriores a `comision_desde` inventaría ingreso que nadie cobró
// nunca, en una pantalla que se ve perfectamente sana.
//
// Por eso la comisión sale SOLO de dos lugares, en este orden:
//   1. `payments.platform_fee_mxn` — el monto congelado, si existe.
//   2. `reservations.commission_pct` × el pago — el porcentaje congelado.
// Si ninguno de los dos está, la comisión de esa venta es CERO. No se estima.

export type PanoramaPlataforma = {
  /** Lo que corrió por la plataforma. NO es ingreso de la casa. */
  gmv: { mes: Dinero; historico: Dinero };
  /**
   * Lo único que la casa gana.
   *
   * ⚠️ LAS TRES DECÍAN MENTIRAS DISTINTAS hasta el 24 sep 2026:
   *
   *   · `cobrada` estaba clavada en 0 «porque operator_payables está vacía» —
   *     pero esa tabla es la dirección contraria (lo que la operadora le debe a
   *     Caminante). La comisión ya está en la cuenta de la casa en LOS DOS
   *     canales: con `casa` cobró todo y transfirió el resto, con Connect Stripe
   *     la retuvo en el cobro. Nunca fue una cuenta por cobrar.
   *   · `porCobrar` repetía la devengada, o sea que la pantalla decía que
   *     alguien nos debía $3,620.64 que ya teníamos.
   *   · `devengada` sumaba TODO el histórico y Recursos la pintaba con la
   *     etiqueta «· Septiembre». Hoy coincide por casualidad —toda la comisión
   *     es de septiembre— y en octubre habría mostrado el dinero de septiembre
   *     con el rótulo de octubre.
   */
  comision: {
    /** Congelada en los pagos, histórico. */
    devengada: number;
    devengadaMes: number;
    /** Devuelta a la operadora como concesión declarada (0067). */
    concedida: number;
    concedidaMes: number;
    /** Lo que de verdad se quedó la casa: devengada − concedida. */
    cobrada: number;
    cobradaMes: number;
    /** Lo que una operadora le debe a Caminante (`operator_payables`). */
    porCobrar: number;
  };
  operadoras: { externas: number; vendiendoEsteMes: number; nombres: string[] };
  /** La fecha desde la que la primera operadora puede generar comisión. */
  primerArranque: string | null;
  solicitudesEsperando: number;
  /** Para el texto que explica el cero sin mentir. */
  ningunaExternaHaVendido: boolean;
  mesEnCurso: string;
};

type Dinero = { monto: number; reservas: number };

const r2 = (x: number) => Math.round(x * 100) / 100;

export async function fetchPanoramaPlataforma(): Promise<PanoramaPlataforma> {
  const sb = createSupabaseAdminClient();
  const ahora = new Date();
  const desdeMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();

  const [
    { data: ops },
    { data: resv },
    { data: pagos },
    { count: solicitudes },
    { data: liqs },
    { data: deudas },
  ] = await Promise.all([
    sb.from("operators").select("id, name, es_la_casa, comision_desde"),
    sb
      .from("reservations")
      .select("id, status, total_amount_mxn, created_at, commission_pct, experiences(operator_id)"),
    sb.from("payments").select("reservation_id, amount_mxn, status, paid_at, platform_fee_mxn"),
    sb.from("slot_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    // Las concesiones: comisión que se devolvió al liquidar, con su motivo (0067).
    sb.from("operator_liquidaciones").select("diferencia_mxn, pagado_el, cancelada_at"),
    // Lo que una operadora le debe a Caminante. Sigue vacía, y por eso el
    // «por cobrar» es cero — pero ahora se DERIVA en vez de suponerse.
    sb.from("operator_payables").select("monto_mxn, estado"),
  ]);

  type Op = { id: string; name: string; es_la_casa: boolean; comision_desde: string | null };
  const operadoras = (ops ?? []) as Op[];
  const casa = new Set(operadoras.filter((o) => o.es_la_casa).map((o) => o.id));
  const arranque = new Map(operadoras.map((o) => [o.id, o.comision_desde]));

  type Res = {
    id: string;
    status: string;
    total_amount_mxn: number | null;
    created_at: string;
    commission_pct: number | null;
    experiences: { operator_id: string | null } | null;
  };
  // Sólo lo PAGADO cuenta como vendido. Una reserva cancelada no es una venta,
  // y una solicitada todavía no lo es.
  const pagadas = ((resv ?? []) as unknown as Res[]).filter((r) => r.status === "paid");

  const suma = (rs: Res[]): Dinero => ({
    monto: rs.reduce((a, r) => a + Number(r.total_amount_mxn ?? 0), 0),
    reservas: rs.length,
  });

  const porReserva = new Map(pagadas.map((r) => [r.id, r]));
  type Pago = {
    reservation_id: string | null;
    amount_mxn: number | null;
    status: string;
    paid_at: string | null;
    platform_fee_mxn: number | null;
  };

  let devengada = 0;
  // ⚠️ EL CORTE DEL MES ES LA PREGUNTA QUE RECURSOS EXISTE PARA CONTESTAR
  // («¿cómo cerró el mes?»), y hasta hoy la tarjeta decía «· Septiembre» sobre
  // un número histórico. Se lleva aparte para que la etiqueta no mienta.
  let devengadaMes = 0;
  const vendiendo = new Set<string>();
  for (const p of ((pagos ?? []) as Pago[]).filter((p) => p.status === "paid" && p.paid_at)) {
    const r = p.reservation_id ? porReserva.get(p.reservation_id) : undefined;
    const dueño = r?.experiences?.operator_id ?? null;
    if (!dueño || casa.has(dueño)) continue; // la casa no se cobra comisión a sí misma

    // El arranque: lo vendido antes de esa fecha ya pasó sin comisión (0047).
    const desde = arranque.get(dueño);
    if (!desde || (p.paid_at as string) < desde) continue;

    // Sólo lo congelado. Ver la nota de arriba: no hay tercera opción.
    const congelado =
      p.platform_fee_mxn != null
        ? Number(p.platform_fee_mxn)
        : r?.commission_pct != null
          ? (Number(p.amount_mxn ?? 0) * Number(r.commission_pct)) / 100
          : 0;
    devengada += congelado;
    if ((p.paid_at as string) >= desdeMes) {
      devengadaMes += congelado;
      vendiendo.add(dueño);
    }
  }

  // ── LO QUE SE DEVOLVIÓ AL LIQUIDAR ────────────────────────────────────────
  // Una concesión es comisión que la casa generó y no se quedó (0067). No se
  // resta de `platform_fee_mxn` —ésa está congelada a propósito— así que el
  // ingreso real sólo se ve restándola aquí.
  let concedida = 0;
  let concedidaMes = 0;
  for (const l of (liqs ?? []) as { diferencia_mxn: number | null; pagado_el: string | null; cancelada_at: string | null }[]) {
    if (l.cancelada_at) continue;
    const d = Number(l.diferencia_mxn || 0);
    if (d <= 0) continue; // una diferencia negativa no es una concesión: es un ajuste a favor
    concedida += d;
    if ((l.pagado_el ?? "") >= desdeMes.slice(0, 10)) concedidaMes += d;
  }

  // ── LO QUE DE VERDAD NOS DEBEN ────────────────────────────────────────────
  // `operator_payables` es la dirección «la operadora le debe a Caminante».
  // Sigue vacía, así que esto da cero — pero ahora es un cero DERIVADO, no uno
  // escrito a mano que no sabría cambiar el día que deje de ser cierto.
  const porCobrar = ((deudas ?? []) as { monto_mxn: number | null; estado: string }[])
    .filter((d) => d.estado === "por_pagar")
    .reduce((a, d) => a + Number(d.monto_mxn || 0), 0);

  const externas = operadoras.filter((o) => !o.es_la_casa);
  const arranques = externas.map((o) => o.comision_desde).filter(Boolean).sort() as string[];

  return {
    gmv: {
      mes: suma(pagadas.filter((r) => r.created_at >= desdeMes)),
      historico: suma(pagadas),
    },
    comision: {
      devengada: r2(devengada),
      devengadaMes: r2(devengadaMes),
      concedida: r2(concedida),
      concedidaMes: r2(concedidaMes),
      // Lo que se quedó la casa. La comisión entra en el cobro —por los dos
      // canales— y lo único que la baja es lo que se devolvió al liquidar.
      cobrada: r2(devengada - concedida),
      cobradaMes: r2(devengadaMes - concedidaMes),
      porCobrar: r2(porCobrar),
    },
    operadoras: {
      externas: externas.length,
      vendiendoEsteMes: vendiendo.size,
      nombres: externas.map((o) => o.name),
    },
    primerArranque: arranques[0] ?? null,
    solicitudesEsperando: solicitudes ?? 0,
    ningunaExternaHaVendido: vendiendo.size === 0 && devengada === 0,
    mesEnCurso: ahora.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
      timeZone: "America/Mexico_City",
    }),
  };
}
