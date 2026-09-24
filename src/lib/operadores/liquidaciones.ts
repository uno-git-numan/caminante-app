import "server-only";

// LO QUE CAMINANTE LE DEBE A UNA OPERADORA, Y LO QUE YA LE PAGÓ.
//
// Es el paso 8 de los diez del MVP —«que se le liquide»— y hasta el 23 sep 2026
// no existía: `operator_payables` está vacía y además es la otra dirección (lo
// que ella le debe a Caminante; el panel las llama «cobros»).
//
// ⚠️ SÓLO EL CANAL `casa`. Con Connect el cobro entra a nombre de la operadora y
// su parte NUNCA toca la cuenta de Caminante, así que no hay nada que
// liquidarle: Stripe ya se lo dio. Mezclar los dos canales aquí haría que el
// panel prometiera transferencias que no van a pasar. La base también lo impide
// (trigger `solo_la_casa_se_liquida`, 0066).
//
// ⚠️ Y LO QUE SE DEBE NO SE GUARDA: SE DERIVA. Es cobrado − devuelto − comisión,
// y las tres cosas ya viven en `payments`. Una columna «saldo» sería un cuarto
// número que hay que mantener al día — exactamente el bicho de `seats_taken`,
// que mentía en 6 de 14 salidas por llevar la cuenta aparte.
//
// Lo único que SÍ se escribe es el hecho que no se puede derivar de nada: que
// el dinero salió del banco. Eso vive en `operator_liquidaciones`.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const r2 = (x: number) => Math.round(x * 100) / 100;

export type PagoPorLiquidar = {
  paymentId: string;
  reservationId: string | null;
  /** Lo que el cliente pagó. */
  cobradoMxn: number;
  /** Lo que se le devolvió (0063). Se resta: no se liquida dinero que volvió. */
  devueltoMxn: number;
  /** La comisión congelada de esa venta. Se queda Caminante. */
  comisionMxn: number;
  /** Lo que le toca a la operadora. */
  netoMxn: number;
  pagadoEl: string | null;
};

export type SaldoDeOperadora = {
  operatorId: string;
  /** Lo que le toca de todo lo cobrado por la casa, histórico. */
  devengadoMxn: number;
  /**
   * Lo que de lo transferido SALDA deuda (liquidaciones no canceladas, sin
   * contar las diferencias declaradas). Ver `concedidoMxn`.
   */
  liquidadoMxn: number;
  /**
   * Lo transferido POR ENCIMA de lo calculado, con su motivo escrito (0067).
   *
   * ⚠️ No salda deuda, y por eso va aparte: si se contara como pago, el saldo
   * diría que se le pagó de más cuando lo que hubo fue una concesión acordada.
   * Nomádika, 18 sep 2026: $1,328.33 de menos comisión por ser su primera
   * experiencia.
   */
  concedidoMxn: number;
  /** Lo que falta. Nunca negativo: si sale, es que se le pagó de más y se dice. */
  porLiquidarMxn: number;
  /** Los pagos concretos que faltan, para poder armar la transferencia. */
  pendientes: PagoPorLiquidar[];
  /** ⚠️ Se le transfirió MÁS de lo que le tocaba. No se tapa: se reporta. */
  pagadoDeMasMxn: number;
};

/**
 * Lo que de un pago le toca a la operadora.
 *
 * ⚠️ EL ORDEN DE LAS RESTAS IMPORTA, y no es el mismo que «lo que gana
 * Caminante». La comisión se cobró sobre la venta completa; si después hubo una
 * devolución parcial, Stripe devolvió la comisión en la MISMA proporción
 * (medido: un refund del 50% devolvió el 50% de la comisión). Así que lo que le
 * queda a la operadora es lo cobrado menos lo devuelto menos lo que Caminante
 * retuvo de lo que se quedó — y eso es exactamente `platform_fee_mxn` ajustado
 * en la misma proporción.
 */
export function netoDelPago(p: {
  cobradoMxn: number;
  devueltoMxn: number;
  comisionMxn: number;
}): number {
  const cobrado = p.cobradoMxn || 0;
  if (cobrado <= 0) return 0;
  const devuelto = Math.min(p.devueltoMxn || 0, cobrado);
  const sequedo = cobrado - devuelto;
  // La comisión sigue a lo que el cliente acabó pagando (Cláusula Quinta del
  // convenio, y lo que Stripe hace solo).
  const comision = r2(((p.comisionMxn || 0) * sequedo) / cobrado);
  return r2(sequedo - comision);
}

/**
 * El saldo de UNA operadora, o de todas.
 *
 * `operatorId` en null = todas las externas. La casa no aparece nunca: no se
 * liquida a sí misma.
 */
export async function saldosDeOperadoras(
  operatorId?: string | null,
): Promise<SaldoDeOperadora[]> {
  const sb = createSupabaseAdminClient();

  const [{ data: ops }, { data: resv }, { data: pays }, { data: liqs }, { data: vinc }] =
    await Promise.all([
      sb.from("operators").select("id, es_la_casa"),
      // ⚠️ LA ATRIBUCIÓN SE LEE DE LA RESERVA, no de la experiencia. Se congela
      // al vender (0016) y no se rellena hacia atrás: si una experiencia cambia
      // de dueño mañana, lo vendido ayer sigue siendo de quien lo vendió.
      sb.from("reservations").select("id, operator_id"),
      sb
        .from("payments")
        .select("id, reservation_id, amount_mxn, refunded_mxn, platform_fee_mxn, canal_cobro, status, paid_at")
        .eq("status", "paid")
        .eq("canal_cobro", "casa"),
      sb.from("operator_liquidaciones").select("id, operator_id, monto_mxn, diferencia_mxn, cancelada_at"),
      sb.from("operator_liquidacion_pagos").select("payment_id"),
    ]);

  const dueñoDeReserva = new Map<string, string | null>();
  for (const r of (resv ?? []) as { id: string; operator_id: string | null }[]) {
    dueñoDeReserva.set(r.id, r.operator_id);
  }
  const yaLiquidados = new Set(
    ((vinc ?? []) as { payment_id: string }[]).map((v) => v.payment_id),
  );

  const porOperadora = new Map<string, PagoPorLiquidar[]>();
  const devengado = new Map<string, number>();

  for (const p of (pays ?? []) as Record<string, unknown>[]) {
    const dueño = p.reservation_id ? dueñoDeReserva.get(p.reservation_id as string) : null;
    if (!dueño) continue;
    const cobradoMxn = Number(p.amount_mxn || 0);
    const devueltoMxn = Number(p.refunded_mxn || 0);
    const comisionMxn = Number(p.platform_fee_mxn || 0);
    const netoMxn = netoDelPago({ cobradoMxn, devueltoMxn, comisionMxn });
    devengado.set(dueño, r2((devengado.get(dueño) ?? 0) + netoMxn));
    // Un neto de cero no se liquida: no hay transferencia que hacer.
    if (netoMxn > 0 && !yaLiquidados.has(p.id as string)) {
      const lista = porOperadora.get(dueño) ?? [];
      lista.push({
        paymentId: p.id as string,
        reservationId: (p.reservation_id as string) ?? null,
        cobradoMxn,
        devueltoMxn,
        comisionMxn,
        netoMxn,
        pagadoEl: (p.paid_at as string) ?? null,
      });
      porOperadora.set(dueño, lista);
    }
  }

  // ⚠️ LO QUE SALDA DEUDA ES EL MONTO MENOS LA DIFERENCIA DECLARADA. Contar la
  // transferencia completa haría que una concesión apareciera como sobrepago —
  // que es justo lo que pasó con la primera liquidación real y lo que la 0067
  // vino a resolver.
  const liquidado = new Map<string, number>();
  const concedido = new Map<string, number>();
  for (const l of (liqs ?? []) as Record<string, unknown>[]) {
    if (l.cancelada_at) continue;
    const id = l.operator_id as string;
    const dif = Number(l.diferencia_mxn || 0);
    liquidado.set(id, r2((liquidado.get(id) ?? 0) + Number(l.monto_mxn || 0) - dif));
    concedido.set(id, r2((concedido.get(id) ?? 0) + dif));
  }

  const externas = ((ops ?? []) as { id: string; es_la_casa: boolean | null }[])
    .filter((o) => o.es_la_casa !== true)
    .filter((o) => !operatorId || o.id === operatorId);

  return externas.map((o) => {
    const dev = devengado.get(o.id) ?? 0;
    const liq = liquidado.get(o.id) ?? 0;
    const diferencia = r2(dev - liq);
    return {
      operatorId: o.id,
      devengadoMxn: dev,
      liquidadoMxn: liq,
      concedidoMxn: concedido.get(o.id) ?? 0,
      porLiquidarMxn: Math.max(0, diferencia),
      // ⚠️ SE DICE, NO SE ESCONDE. Si se le transfirió más de lo que le tocaba
      // —una liquidación capturada de más, o una devolución posterior a la
      // transferencia— un `max(0)` a secas lo haría desaparecer de la pantalla
      // y nadie lo perseguiría. Es el mismo criterio que las tres cuentas de
      // una salida: el desfase se AVISA.
      pagadoDeMasMxn: diferencia < 0 ? r2(-diferencia) : 0,
      pendientes: (porOperadora.get(o.id) ?? []).sort((a, b) =>
        (a.pagadoEl ?? "").localeCompare(b.pagadoEl ?? ""),
      ),
    };
  });
}
