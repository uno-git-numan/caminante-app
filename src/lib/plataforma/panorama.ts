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
  /** Lo único que la casa gana. */
  comision: { devengada: number; cobrada: number; porCobrar: number };
  operadoras: { externas: number; vendiendoEsteMes: number; nombres: string[] };
  /** La fecha desde la que la primera operadora puede generar comisión. */
  primerArranque: string | null;
  solicitudesEsperando: number;
  /** Para el texto que explica el cero sin mentir. */
  ningunaExternaHaVendido: boolean;
  mesEnCurso: string;
};

type Dinero = { monto: number; reservas: number };

export async function fetchPanoramaPlataforma(): Promise<PanoramaPlataforma> {
  const sb = createSupabaseAdminClient();
  const ahora = new Date();
  const desdeMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();

  const [{ data: ops }, { data: resv }, { data: pagos }, { count: solicitudes }] = await Promise.all([
    sb.from("operators").select("id, name, es_la_casa, comision_desde"),
    sb
      .from("reservations")
      .select("id, status, total_amount_mxn, created_at, commission_pct, experiences(operator_id)"),
    sb.from("payments").select("reservation_id, amount_mxn, status, paid_at, platform_fee_mxn"),
    sb.from("slot_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
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
    if ((p.paid_at as string) >= desdeMes) vendiendo.add(dueño);
  }

  const externas = operadoras.filter((o) => !o.es_la_casa);
  const arranques = externas.map((o) => o.comision_desde).filter(Boolean).sort() as string[];

  return {
    gmv: {
      mes: suma(pagadas.filter((r) => r.created_at >= desdeMes)),
      historico: suma(pagadas),
    },
    // Cobrada y por cobrar viven en `operator_payables`, que hoy está vacía y no
    // se rellena sola: se llena cuando se le cobra a una operadora. Mientras no
    // exista ese movimiento, lo honesto es cero — no repetir la devengada aquí,
    // que las haría ver iguales para siempre.
    comision: { devengada, cobrada: 0, porCobrar: devengada },
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
