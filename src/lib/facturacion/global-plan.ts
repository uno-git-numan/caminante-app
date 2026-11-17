// QUÉ ENTRA A LA FACTURA GLOBAL Y HASTA CUÁNDO SE FACTURA POR SEPARADO.
//
// Desde el 17 nov 2026 la plataforma NO usa los recibos (E-Receipts) de
// Facturapi: son un producto aparte de $599 al mes POR ORGANIZACIÓN, y la API
// que ya pagamos emite la global como un CFDI normal a público en general. La
// global se arma aquí, con los pagos del mes:
//
//   · un concepto por pago, como pide la guía de llenado del CFDI global
//     (Anexo 20, CFDI 4.0): clave 01010101, unidad ACT, descripción «Venta»,
//     cantidad 1 y el FOLIO de la operación como número de identificación;
//   · por lo NETO: lo cobrado menos lo devuelto (D19);
//   · forma de pago: la de mayor importe entre las operaciones del periodo.
//
// Módulo puro a propósito: lo prueban los tests sin servidor. Lo ejecuta
// lib/facturacion/global.ts.

import { dentroDelCorte } from "@/lib/facturacion/corte";
import { netoDePago } from "@/lib/facturacion/devolucion-plan";

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Tope de conceptos de un CFDI en Facturapi. */
export const MAX_RENGLONES_GLOBAL = 5000;

/** El folio de una operación, el mismo en el comprobante del cliente y en la global. */
export const folioDePago = (folio: number | string): string => `CAM-${String(folio).padStart(6, "0")}`;

export const formaPagoDe = (method: string | null) => (method === "transfer" ? "03" : method === "cash" ? "01" : "04");

/**
 * El último instante en que un pago se puede facturar por separado: el fin de
 * su mes, hora de CDMX (UTC−6). Después entra en la global de ese mes.
 */
export function limiteParaFacturar(paidAt: string): Date {
  const local = new Date(new Date(paidAt).getTime() - 6 * 3600_000); // reloj de CDMX leído como UTC
  const finDeMesLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - 1;
  return new Date(finDeMesLocal + 6 * 3600_000);
}

/** ¿Todavía se puede facturar por separado? Sin fecha de cobro, no. */
export function enPlazoParaFacturar(paidAt: string | null | undefined, ahora = new Date()): boolean {
  if (!paidAt || !Number.isFinite(new Date(paidAt).getTime())) return false;
  return ahora.getTime() <= limiteParaFacturar(paidAt).getTime();
}

export type PagoParaGlobal = {
  id: string;
  folio: number | string;
  amount_mxn: number | null;
  refunded_mxn: number | null;
  status: string;
  status_cfdi: string;
  paid_at: string | null;
  method: string | null;
};

export type RenglonGlobal = { paymentId: string; folio: string; neto: number; devuelto: number; formaPago: string };

export type PlanGlobal = {
  renglones: RenglonGlobal[];
  total: number;
  /** La forma de pago con la que se liquidó el mayor importe del periodo. */
  formaPago: string;
  /** Los que no entran, y por qué (para el reporte; no detienen la global). */
  fuera: { paymentId: string; porque: string }[];
};

/**
 * Los pagos de UN emisor que entran a la global de un periodo. Entra lo cobrado
 * dentro del periodo y desde el corte, todavía `por-emitir` y con algo neto por
 * facturar. Lo facturado al cliente, lo de la contadora (`externo`), lo devuelto
 * completo y lo anterior al corte quedan fuera.
 */
export function planGlobal(pagos: PagoParaGlobal[], periodo: { desde: string; hasta: string }): PlanGlobal {
  const desde = new Date(periodo.desde).getTime();
  const hasta = new Date(periodo.hasta).getTime();
  const renglones: RenglonGlobal[] = [];
  const fuera: PlanGlobal["fuera"] = [];
  const porForma = new Map<string, number>();
  for (const p of pagos) {
    const t = p.paid_at ? new Date(p.paid_at).getTime() : NaN;
    if (!Number.isFinite(t) || t < desde || t > hasta) continue; // de otro periodo: ni se reporta
    const neto = netoDePago(p);
    if (p.status_cfdi !== "por-emitir") fuera.push({ paymentId: p.id, porque: `ya está ${p.status_cfdi}` });
    else if (!dentroDelCorte(p.paid_at)) fuera.push({ paymentId: p.id, porque: "cobro anterior al corte" });
    else if (p.status !== "paid") fuera.push({ paymentId: p.id, porque: `el pago está ${p.status}` });
    else if (!(neto > 0.009)) fuera.push({ paymentId: p.id, porque: "se devolvió completo" });
    else {
      const formaPago = formaPagoDe(p.method);
      renglones.push({ paymentId: p.id, folio: folioDePago(p.folio), neto, devuelto: r2(Number(p.refunded_mxn ?? 0)), formaPago });
      porForma.set(formaPago, r2((porForma.get(formaPago) ?? 0) + neto));
    }
  }
  const formaPago = [...porForma.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "04";
  return { renglones, total: r2(renglones.reduce((n, r) => n + r.neto, 0)), formaPago, fuera };
}

const TZ_OFFSET = "-06:00"; // CDMX sin horario de verano desde 2022

export type Periodo = { clave: string; desde: string; hasta: string; mes: string; anio: number; desdeFecha: string; hastaFecha: string };

/** Un mes calendario de CDMX como periodo de la global. `mes` es 1-12. */
export function periodoDeMes(anio: number, mes: number): Periodo {
  const inicio = new Date(Date.UTC(anio, mes - 1, 1));
  const fin = new Date(Date.UTC(anio, mes, 0)); // último día del mes
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const mm = String(mes).padStart(2, "0");
  return {
    clave: `${anio}-${mm}`,
    desde: `${ymd(inicio)}T00:00:00.000${TZ_OFFSET}`,
    hasta: `${ymd(fin)}T23:59:59.999${TZ_OFFSET}`,
    mes: mm,
    anio,
    desdeFecha: ymd(inicio),
    hastaFecha: ymd(fin),
  };
}

/** El mes (de CDMX) en que cayó un cobro, como `YYYY-MM`. null si no hay fecha. */
export function mesDeCobro(paidAt: string | null | undefined): string | null {
  const t = paidAt ? new Date(paidAt).getTime() : NaN;
  if (!Number.isFinite(t)) return null;
  return new Date(t - 6 * 3600_000).toISOString().slice(0, 7); // reloj de CDMX leído como UTC
}

/** El mes anterior al de `hoy` (visto desde CDMX): el último mes CERRADO. */
export function periodoAnterior(hoy = new Date()): Periodo {
  const local = new Date(hoy.getTime() - 6 * 3600_000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth(); // 0-11, mes actual
  return m === 0 ? periodoDeMes(y - 1, 12) : periodoDeMes(y, m);
}

/**
 * Cómo sale la global de un emisor para un mes cerrado, según las que ya tenga
 * timbradas de ese mes (D21 de legal):
 *   · ninguna → la global del mes, fechada el último día del periodo si aún
 *     está dentro de las 72 horas;
 *   · ya hay una → COMPLEMENTARIA: mismo mes en el nodo global, con la fecha del
 *     día en que se emite. Es el camino de un pago que se capturó tarde (una
 *     transferencia registrada después de timbrada la global de su mes).
 * La llave de idempotencia cambia con cada complementaria: reintentar la misma
 * no timbra dos, y la siguiente no se confunde con la anterior.
 */
export function modoDeGlobal(periodo: Periodo, emisorId: string | null, yaTimbradas: number, ahora = new Date()): { complementaria: boolean; fecha: string | null; idempotencyKey: string } {
  const base = `global-${emisorId ?? "casa"}-${periodo.desdeFecha}`;
  if (yaTimbradas > 0) return { complementaria: true, fecha: null, idempotencyKey: `${base}-c${yaTimbradas}` };
  return { complementaria: false, fecha: fechaDeEmisionGlobal(periodo, ahora), idempotencyKey: base };
}

/**
 * La fecha de emisión de la global: dentro del MES QUE FACTURA (lo pidió la
 * contadora el 12 nov 2026: «la fecha de emisión debe ser del mes al que
 * corresponde»). El SAT —y Facturapi— aceptan una fecha de hasta 72 horas
 * atrás, y el cron corre el día 1 a las 7:00 de CDMX, así que se fecha el
 * último día del periodo a las 20:00 de CDMX: sigue siendo ese día en cualquier
 * huso de México (el CFDI lleva la hora local del emisor).
 *
 * Si ya pasaron más de 71 horas (el cron falló y se corrió tarde), devuelve
 * null: la global sale con la fecha de hoy y el resultado lo dice.
 */
export function fechaDeEmisionGlobal(periodo: { hastaFecha: string }, ahora = new Date()): string | null {
  const fecha = new Date(`${periodo.hastaFecha}T20:00:00-06:00`);
  const horas = (ahora.getTime() - fecha.getTime()) / 3600_000;
  return horas >= 0 && horas <= 71 ? fecha.toISOString() : null;
}

/**
 * La frase del plazo para pedir factura, para decirla ANTES de pagar (D21,
 * LFPC art. 7): quien paga hoy puede facturar hasta el último día de este mes.
 */
export function avisoPlazoFactura(ahora = new Date()): string {
  const limite = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long" }).format(limiteParaFacturar(ahora.toISOString()));
  return `¿Necesitas factura? Pídela en tu espacio a más tardar el ${limite}. Después, tu pago entra en la factura global del mes y ya no se puede facturar por separado.`;
}
