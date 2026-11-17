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

/** El mes anterior al de `hoy` (visto desde CDMX), en fechas ISO con huso de CDMX. */
export function periodoAnterior(hoy = new Date()): { desde: string; hasta: string; mes: string; anio: number; desdeFecha: string; hastaFecha: string } {
  const local = new Date(hoy.getTime() - 6 * 3600_000); // reloj de CDMX leído como UTC
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth(); // 0-11, mes actual
  const inicio = new Date(Date.UTC(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, 1));
  const fin = new Date(Date.UTC(y, m, 0)); // último día del mes anterior
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return {
    desde: `${ymd(inicio)}T00:00:00.000${TZ_OFFSET}`,
    hasta: `${ymd(fin)}T23:59:59.999${TZ_OFFSET}`,
    mes: String(inicio.getUTCMonth() + 1).padStart(2, "0"),
    anio: inicio.getUTCFullYear(),
    desdeFecha: ymd(inicio),
    hastaFecha: ymd(fin),
  };
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
