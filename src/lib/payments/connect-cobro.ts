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
//   · `transfer_data.destination` = la cuenta conectada ⇒ el dinero, menos la
//     comisión, se transfiere a ella.
//   · `application_fee_amount` = lo que se queda Numan.
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
// ⚠️ UN SOLO MOTOR. El monto sale del mismo `comisionDeVenta` que ya congela
// `platform_fee_mxn` desde julio. Dos caminos de cobro, una sola aritmética: si
// alguna vez divergen, el corte deja de cuadrar con el banco y nadie se entera
// hasta que un operador reclama.

import { IVA } from "@/lib/operadores/comision";
import { toStripeAmount } from "@/lib/payments/stripe";
import { requiereConnect, operadorListo, type OperadorParaGate } from "@/lib/operators/listo-para-vender";

/** Los dos caminos. Se guarda en `payments.canal_cobro`. */
export type CanalCobro = "casa" | "connect";

export type PlanDeCobro =
  | { canal: "casa" }
  | {
      canal: "connect";
      /** `acct_…` de la operadora. Va a `on_behalf_of` y a `transfer_data`. */
      cuenta: string;
      /** Comisión + IVA, en centavos. Es el `application_fee_amount`. */
      feeCentavos: number;
      /** El mismo monto en pesos, para decirlo y para conciliar. */
      retenidoMxn: number;
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
): PlanDeCobro {
  if (!requiereConnect(operador)) return { canal: "casa" };
  if (!operadorListo(operador).ok) return { canal: "casa" };

  const cuenta = operador?.stripe_account_id?.trim();
  if (!cuenta) return { canal: "casa" };

  const retenido = retencionDe(comisionSinIva);
  // Sin nada que retener no hay cargo con destino que valga: transferiría el
  // 100% y Numan ganaría cero, que es justo lo que el gate existe para impedir.
  if (!(retenido > 0)) return { canal: "casa" };

  const feeCentavos = Math.min(toStripeAmount(retenido), toStripeAmount(cobrado));
  return { canal: "connect", cuenta, feeCentavos, retenidoMxn: retenido };
}

/**
 * Lo que se le agrega a `payment_intent_data` cuando el plan es Connect.
 *
 * Se devuelve como objeto para que `createCheckout` lo esparza sin un `if` que
 * duplique la construcción de la sesión: una sola sesión, dos configuraciones.
 */
export function paraStripe(plan: PlanDeCobro): {
  on_behalf_of?: string;
  transfer_data?: { destination: string };
  application_fee_amount?: number;
} {
  if (plan.canal === "casa") return {};
  return {
    on_behalf_of: plan.cuenta,
    transfer_data: { destination: plan.cuenta },
    application_fee_amount: plan.feeCentavos,
  };
}
