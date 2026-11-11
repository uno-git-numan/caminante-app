// CÓMO SE COBRA UNA VENTA — el camino de siempre, o el de Connect.
//
// Hasta el 22 sep 2026 sólo existía uno: todo entraba a NUMAN HUB y se le
// transfería al operador a mano. `connect.ts` daba de alta la cuenta y leía su
// estado, y lo decía en su encabezado — «este módulo NO cobra». Faltaba esta
// mitad.
//
// ── EL MODELO, DECIDIDO POR LUIS (22 sep 2026) ───────────────────────────────
//
// «Stripe cobra su comisión, deposita a Numan la comisión, deposita al operador
// el resto.» Y, fiscalmente, como Airbnb: **la operadora le factura al cliente
// el servicio; Caminante le factura a la operadora sólo su comisión.**
//
// En Stripe eso es un CARGO CON DESTINO con `on_behalf_of`:
//
//   · La sesión se crea en la cuenta de Numan. Los webhooks siguen llegando
//     donde ya llegan, y el código de finalización no cambia de casa.
//   · `on_behalf_of` = la cuenta conectada ⇒ la OPERADORA es el comerciante de
//     liquidación: su nombre en el estado de cuenta del cliente, y ella es
//     quien presta el servicio. Eso es lo que hace coherente que ella facture.
//   · `transfer_data.destination` = la cuenta conectada, y
//     `transfer_data.amount` = LO QUE LE TOCA: lo cobrado menos la comisión
//     (con su IVA) menos la retención de ISR e IVA (lib/fiscal/retencion.ts).
//     Lo demás se queda en Numan desde el cobro.
//
// ── POR QUÉ `transfer_data.amount` Y NO `application_fee_amount` ────────────
// (cambiado el 11 nov 2026, antes de la primera venta por Connect)
//
// Con el modelo Airbnb Numan RETIENE ISR e IVA (decisión D1 de legal). Stripe
// no deja mandar las dos cosas a la vez («mutually exclusive», probado en test
// el 11 nov). Retener por reversión después del cargo sí funciona, pero en un
// reembolso PARCIAL la retención de más se queda en Numan y habría que
// devolverla a mano. Con la transferencia ya neta, Stripe revierte en
// proporción (`reverse_transfer`) y todo cuadra solo. Medido en test con
// $1,750: transferencia $1,241.59; reembolso de $875 revirtió $620.80 (la
// mitad exacta); reembolso del resto revirtió lo que quedaba.
//   · El fee de Stripe lo paga Numan, y sale de la comisión. Eso ya está
//     contabilizado: `comision.ts` cuenta a Stripe como costo de la plataforma
//     (4.85–5% de la base) al fijar las escalas.
//
// ── CUÁNTO SE RETIENE, Y POR QUÉ LLEVA IVA ──────────────────────────────────
//
// `comisionDeVenta` devuelve la comisión SIN IVA, porque una comisión se cobra
// sobre el valor del servicio y no sobre un impuesto que no es de nadie. Pero
// lo que se RETIENE de la transferencia es lo que Caminante le va a facturar a
// la operadora, y esa factura lleva IVA trasladado. Si se retuviera sólo la
// comisión, el CFDI de Caminante saldría por más de lo retenido y la diferencia
// —el 16%— habría que cobrarla aparte, todos los meses, a mano.
//
//   $1,750 al público  →  base $1,508.62
//                      →  comisión $301.72  +  IVA $48.28  =  $350.00 retenidos
//                      →  $1,400.00 a la operadora
//
// `platform_fee_mxn` sigue guardando la comisión SIN IVA: ése es el ingreso de
// la casa, y es el número con el que cuadra el corte. Lo retenido se deriva.
//
// Desde el 11 nov el `transfer.amount` SÍ es lo que recibe la operadora
// ($1,241.59 de una venta de $1,750): ya no hay application_fee que se le
// cargue después. Lo de Numan se deriva de lo congelado en el pago:
// `fee_retenido_mxn` (comisión + IVA) e `isr_retenido_mxn` + `iva_retenido_mxn`
// (la retención). La cuota de admisión (admision.ts) sí es una reversión
// aparte, una sola vez.
//
// ⚠️ UN SOLO MOTOR. El monto sale del mismo `comisionDeVenta` que ya congela
// `platform_fee_mxn` desde julio. Dos caminos de cobro, una sola aritmética: si
// alguna vez divergen, el corte deja de cuadrar con el banco y nadie se entera
// hasta que un operador reclama.

import { IVA } from "@/lib/operadores/comision";
import { toStripeAmount } from "@/lib/payments/stripe";
import { requiereConnect, operadorListo, type OperadorParaGate } from "@/lib/operators/listo-para-vender";
import { retencionDeVenta, type Retencion } from "@/lib/fiscal/retencion";

/** Los dos caminos. Se guarda en `payments.canal_cobro`. */
export type CanalCobro = "casa" | "connect";

export type PlanDeCobro =
  | { canal: "casa" }
  | {
      canal: "connect";
      /** `acct_…` de la operadora. Va a `on_behalf_of` y a `transfer_data`. */
      cuenta: string;
      /** Comisión + IVA, en pesos: lo que Caminante le factura a la operadora. */
      retenidoMxn: number;
      /** ISR e IVA retenidos, congelados al cobrar (lib/fiscal/retencion.ts). */
      retencion: Retencion;
      /** Lo que le llega: cobrado − comisión con IVA − retención. Es `transfer_data.amount`. */
      transferCentavos: number;
    };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Lo que Numan retiene de una venta por Connect: comisión + su IVA. */
export function retencionDe(comisionSinIva: number): number {
  return r2(comisionSinIva * (1 + IVA));
}

/**
 * ¿Por dónde cobra esta venta?
 *
 * ⚠️ ANTE LA DUDA, POR LA CASA. Si la operadora no está en Connect, o no está
 * lista, o la cuenta viene vacía, se cobra como siempre: el dinero entra a
 * NUMAN HUB y se le transfiere a mano. Ese camino ya funciona y lleva $742,400
 * cobrados; nunca se rompe por una duda sobre el camino nuevo.
 *
 * El gate (`operadorListo`) NO se consulta aquí por comodidad: lo consulta
 * también `candadosDe` antes de llegar a la caja, y ahí BLOQUEA la venta con su
 * mensaje. Aquí se vuelve a preguntar porque esta función decide a dónde va el
 * dinero, y esa decisión no puede depender de que alguien más haya preguntado.
 *
 * @param cobrado  el total de la venta en pesos. Acota el fee: Stripe rechaza
 *                 una comisión mayor que el cargo, y devolver un plan imposible
 *                 sería fallar en la caja con el cliente enfrente.
 */
export function planDeCobro(
  operador: (OperadorParaGate & { stripe_account_id?: string | null }) | null | undefined,
  comisionSinIva: number,
  cobrado: number,
  fecha: Date = new Date(),
): PlanDeCobro {
  if (!requiereConnect(operador)) return { canal: "casa" };
  if (!operadorListo(operador).ok) return { canal: "casa" };

  const cuenta = operador?.stripe_account_id?.trim();
  if (!cuenta) return { canal: "casa" };

  const retenido = retencionDe(comisionSinIva);
  // Sin nada que retener no hay cargo con destino que valga: transferiría el
  // 100% y Numan ganaría cero, que es justo lo que el gate existe para impedir.
  if (!(retenido > 0)) return { canal: "casa" };

  // ⚠️ EL CANDADO DE LA RETENCIÓN (legal, lista §6 punto 1): sin tasas del
  // ejercicio no se cobra por cuenta conectada. Cobrar por cuenta de ella sin
  // retener sería una retención omitida de la que Numan responde.
  const retencion = retencionDeVenta(cobrado, { conRfc: Boolean(operador?.rfc?.trim()), fecha });
  if (!retencion) return { canal: "casa" };

  const transferCentavos = toStripeAmount(cobrado) - toStripeAmount(retenido) - toStripeAmount(retencion.total);
  // Un caso imposible con precios reales, pero un cargo que le transfiriera
  // cero o menos lo rechazaría Stripe en la caja, con el cliente enfrente.
  if (!(transferCentavos > 0)) return { canal: "casa" };
  return { canal: "connect", cuenta, retenidoMxn: retenido, retencion, transferCentavos };
}

/**
 * Lo que se le agrega a `payment_intent_data` cuando el plan es Connect.
 *
 * Se devuelve como objeto para que `createCheckout` lo esparza sin un `if` que
 * duplique la construcción de la sesión: una sola sesión, dos configuraciones.
 */
export function paraStripe(plan: PlanDeCobro): {
  on_behalf_of?: string;
  transfer_data?: { destination: string; amount: number };
} {
  if (plan.canal === "casa") return {};
  return {
    on_behalf_of: plan.cuenta,
    transfer_data: { destination: plan.cuenta, amount: plan.transferCentavos },
  };
}
