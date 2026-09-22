// LO QUE RECIBE CADA QUIEN DE UNA VENTA.
//
// Una venta de $1,750 es tres números distintos según quién pregunte, y hasta
// hoy el panel enseñaba uno solo —el bruto— a los dos lados:
//
//   cobrado al cliente ..... $1,750.00   lo que salió de su tarjeta
//   retiene la plataforma .. $  350.00   comisión $301.72 + IVA $48.28
//   recibe la operadora .... $1,400.00   lo que le llega al banco
//
// Con todo entrando a NUMAN HUB la confusión no costaba: el operador no veía
// su panel para saber cuánto le iban a depositar, porque el depósito lo hacía
// Luis a mano y se hablaba. Con Connect el dinero le llega solo, y su panel
// tiene que decir el mismo número que su cuenta de Stripe — o va a reclamar
// $350 por venta que nunca fueron suyos.
//
// ── QUÉ ENSEÑA STRIPE, MEDIDO ───────────────────────────────────────────────
//
// Probado el 22 sep 2026 con un cargo real en test. En el balance de la cuenta
// conectada, la operadora ve las TRES:
//
//   bruto        $1,750.00
//   comisiones   $  350.00   (fee_details: application_fee)
//   NETO         $1,400.00   ← y su saldo es éste
//
// La comisión de proceso de Stripe ($86.71) NO aparece de su lado: la paga
// Numan (`controller[fees][payer]=application`). Así que su cuenta es limpia:
// bruto menos la comisión de Caminante, y ya.
//
// Este módulo existe para que el panel diga exactamente eso y no lo derive cada
// pantalla a su manera — que es como el cupo acabó en tres lugares.

/** Lo mínimo de un pago para repartirlo. Se declara aquí para no pedir la fila entera. */
export type PagoParaRepartir = {
  amount_mxn: number | string | null;
  /** La comisión SIN IVA que se congeló al vender. */
  platform_fee_mxn?: number | string | null;
  /** Comisión + IVA, tal como Stripe la retuvo. Sólo en cobros por Connect. */
  fee_retenido_mxn?: number | string | null;
};

export type Reparto = {
  /** Lo que pagó el cliente. */
  cobrado: number;
  /** Lo que se queda la plataforma, CON IVA: es lo que sale de la transferencia. */
  retenido: number;
  /** Lo que recibe la operadora. Es el número que su banco va a confirmar. */
  recibeOperadora: number;
};

const n = (v: unknown): number => {
  const x = typeof v === "string" ? Number(v) : (v as number);
  return typeof x === "number" && Number.isFinite(x) ? x : 0;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

/** El IVA mexicano. Duplicarlo de `comision.ts` sería tener dos; se importa. */
import { IVA } from "@/lib/operadores/comision";

/**
 * Cómo se parte una venta.
 *
 * ⚠️ EL ORDEN DE LAS FUENTES IMPORTA, y no es un fallback por comodidad:
 *
 *   1. `fee_retenido_mxn` — lo que Stripe retuvo DE VERDAD en un cargo con
 *      destino. Es el hecho, no una derivación.
 *   2. `platform_fee_mxn × 1.16` — para los cobros por el camino de la casa,
 *      donde no hubo retención automática: la comisión se congeló sin IVA y lo
 *      que Caminante le va a facturar sí lo lleva.
 *   3. Cero. Sin comisión congelada no se INVENTA una: una venta anterior a
 *      `comision_desde` no generó comisión, y estimarla aquí le descontaría a
 *      la operadora dinero que nadie le cobró. Es la misma regla que sostiene
 *      `panorama.ts`: sólo lo congelado, nunca lo estimado.
 */
export function repartoDe(pago: PagoParaRepartir): Reparto {
  const cobrado = r2(n(pago.amount_mxn));
  const retenidoReal = pago.fee_retenido_mxn != null ? n(pago.fee_retenido_mxn) : null;
  const derivado = pago.platform_fee_mxn != null ? n(pago.platform_fee_mxn) * (1 + IVA) : null;
  const retenido = r2(retenidoReal ?? derivado ?? 0);
  return { cobrado, retenido, recibeOperadora: r2(cobrado - retenido) };
}

/** La suma de varios pagos, ya repartida. Para los KPI del panel. */
export function repartoTotal(pagos: PagoParaRepartir[]): Reparto {
  return pagos.reduce<Reparto>(
    (acc, p) => {
      const r = repartoDe(p);
      return {
        cobrado: r2(acc.cobrado + r.cobrado),
        retenido: r2(acc.retenido + r.retenido),
        recibeOperadora: r2(acc.recibeOperadora + r.recibeOperadora),
      };
    },
    { cobrado: 0, retenido: 0, recibeOperadora: 0 },
  );
}
