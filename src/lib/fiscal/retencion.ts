// LA RETENCIÓN DE ISR E IVA A LA OPERADORA (modelo Airbnb, 11 nov 2026).
//
// Luis: «Hay que hacerlo como hace airbnb entonces. Construye.» En el modelo B
// de Stripe el dinero de la venta entra a la cuenta de NUMAN y se le transfiere
// a la operadora: NUMAN cobra el precio y el IVA POR CUENTA de ella, y la ley
// lo obliga a retenerle ISR e IVA y enterarlos al SAT (decisión D1 de la sesión
// legal, design/legal/DECISIONES-LEGAL-FISCAL-2026-11-11.md). Es lo que hace
// Airbnb con sus anfitriones. NUMAN NO declara por la operadora: retiene, le
// entrega su CFDI de retenciones y entera; ella declara lo suyo y acredita lo
// retenido.
//
// ── CUÁNTO (D2, D3) ─────────────────────────────────────────────────────────
//
//   Base del ISR ... TODO lo que pagó el cliente, sin IVA (experiencia +
//                    complementos − descuentos). La comisión de NUMAN NO se
//                    resta: es un gasto de la operadora, no menos ingreso.
//   ISR ............ 2.5 % de esa base (LIF 2026 art. 25 VI; 20 % sin RFC).
//   IVA ............ 50 % del IVA cobrado (LIVA 18-J II; 100 % sin RFC).
//   Física y moral . igual (LIF 2026 extiende la retención a las morales).
//
//   $1,750 → base $1,508.62 + IVA $241.38 → ISR $37.72 · IVA $120.69
//
// ⚠️ LAS TASAS SON DE LA LIF, Y LA LIF ES ANUAL. Viven aquí por ejercicio. Un
// ejercicio sin tasas NO cobra por cuenta conectada (`planDeCobro` cae a la
// casa): cobrar sin poder retener sería una retención omitida (D1), y de esa
// responde NUMAN solidariamente.
//
// ⚠️ SE CALCULA AL COBRAR y se congela en el pago. Las devoluciones NO se restan
// aquí: lo retenido de una venta devuelta se deriva al leer (proporción
// devuelta), igual que la comisión. Ver `retencionVigente`.

/** El IVA de los precios publicados. Duplicarlo sería tener dos. */
import { IVA } from "@/lib/operadores/comision";

export type TasasDelEjercicio = {
  /** ISR sobre la base sin IVA, con RFC. */
  isr: number;
  /** Fracción del IVA cobrado que se retiene, con RFC. */
  iva: number;
  isrSinRfc: number;
  ivaSinRfc: number;
  /** De dónde salen, para que el CFDI y el corte lo puedan decir. */
  fundamento: string;
};

export const TASAS_POR_EJERCICIO: Readonly<Record<number, TasasDelEjercicio>> = {
  2026: {
    isr: 0.025,
    iva: 0.5,
    isrSinRfc: 0.2,
    ivaSinRfc: 1,
    fundamento: "LIF 2026 art. 25 VI y IX; LISR 113-A y 113-C IV; LIVA 18-J II a)",
  },
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** El ejercicio fiscal de una fecha, en hora de la Ciudad de México. */
export function ejercicioDe(fecha: Date): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric" }).format(fecha));
}

export type Retencion = {
  ejercicio: number;
  conRfc: boolean;
  /** Lo cobrado sin IVA. */
  base: number;
  /** El IVA trasladado al cliente. */
  ivaCobrado: number;
  isr: number;
  iva: number;
  /** isr + iva: lo que NUMAN se queda para enterar. */
  total: number;
  tasaIsr: number;
  tasaIva: number;
  /** Texto corto que se congela en el pago: «2026:isr=0.025;iva=0.5;rfc». */
  regla: string;
};

/**
 * La retención de una venta cobrada por cuenta conectada.
 *
 * @param cobrado  lo que pagó el cliente, CON IVA (el precio publicado lo trae).
 * @returns null si el ejercicio no tiene tasas: entonces NO se cobra por
 *          cuenta conectada.
 */
export function retencionDeVenta(
  cobrado: number,
  opts: { conRfc: boolean; fecha?: Date },
): Retencion | null {
  const ejercicio = ejercicioDe(opts.fecha ?? new Date());
  const t = TASAS_POR_EJERCICIO[ejercicio];
  if (!t || !(cobrado > 0)) return null;

  const total = r2(cobrado);
  const base = r2(total / (1 + IVA));
  // El IVA es la resta, no base × 16 %: así base + IVA = lo cobrado al centavo,
  // que es como lo desglosa el CFDI de la operadora.
  const ivaCobrado = r2(total - base);
  const tasaIsr = opts.conRfc ? t.isr : t.isrSinRfc;
  const tasaIva = opts.conRfc ? t.iva : t.ivaSinRfc;
  const isr = r2(base * tasaIsr);
  const iva = r2(ivaCobrado * tasaIva);
  return {
    ejercicio,
    conRfc: opts.conRfc,
    base,
    ivaCobrado,
    isr,
    iva,
    total: r2(isr + iva),
    tasaIsr,
    tasaIva,
    regla: `${ejercicio}:isr=${tasaIsr};iva=${tasaIva};${opts.conRfc ? "rfc" : "sin_rfc"}`,
  };
}

/**
 * Lo retenido que SIGUE en pie después de devoluciones, en proporción a lo
 * devuelto. Es lo que se reporta en el CFDI de retenciones y se entera: una
 * venta devuelta completa no retiene nada (D9).
 */
export function retencionVigente(
  pago: { amount_mxn: number | string | null; isr_retenido_mxn?: number | string | null; iva_retenido_mxn?: number | string | null },
  devuelto: number,
): { isr: number; iva: number } {
  const monto = Number(pago.amount_mxn ?? 0);
  const isr = Number(pago.isr_retenido_mxn ?? 0);
  const iva = Number(pago.iva_retenido_mxn ?? 0);
  if (!(monto > 0)) return { isr: 0, iva: 0 };
  const queda = Math.max(0, Math.min(1, (monto - devuelto) / monto));
  return { isr: r2(isr * queda), iva: r2(iva * queda) };
}
