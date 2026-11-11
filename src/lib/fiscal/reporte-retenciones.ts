// EL REPORTE MENSUAL DE RETENCIONES (11 nov 2026).
//
// Marisol: «Espero que el sistema que utilizas pueda proporcionar el reporte de
// las retenciones del mes para presentar las informativas que se generan.»
// Luis: «esto debemos contemplarlo también, para poderlo declarar ante el SAT».
//
// Con el modelo Airbnb, NUMAN cada mes (decisión D4 de legal):
//   · entera el ISR y el IVA retenidos ............... día 17
//   · da a cada operadora su CFDI de retenciones ..... día 5
//   · presenta la informativa de plataformas (18-J III) día 10: nombre, RFC,
//     CURP, domicilio fiscal, banco, CLABE y monto de operaciones de CADA
//     operadora, «aun cuando no se haya cobrado».
// Este reporte es la fuente de las tres: un renglón por operadora con sus
// totales, y el detalle venta por venta para conciliar.
//
// ── QUÉ CUENTA EN UN MES ───────────────────────────────────────────────────
//
//   + las ventas por cuenta conectada COBRADAS en el mes (hora CDMX), con la
//     retención que se congeló al cobrar (0079);
//   − las devoluciones CONFIRMADAS en el mes sobre esas ventas, con su parte
//     proporcional de retención (D9: «se corrigen en el CFDI de retenciones
//     del mes»). Una devolución de una venta de octubre confirmada en noviembre
//     corrige NOVIEMBRE: octubre ya se presentó.
//
// ⚠️ NADA SE INVENTA. Si falta un dato de la operadora (CURP, CLABE…), el
// renglón lo dice vacío y `faltan` lo enumera: la informativa no se presenta
// con huecos rellenados a mano en el sistema.

import { IVA } from "@/lib/operadores/comision";
import type { Domicilio } from "@/lib/operadores/fiscal-privado";

const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => {
  const x = typeof v === "string" ? Number(v) : (v as number);
  return typeof x === "number" && Number.isFinite(x) ? x : 0;
};

/** «2026-11» de una fecha, en hora de la Ciudad de México. */
export function mesCdmx(fecha: string | Date): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit" }).formatToParts(d);
  return `${p.find((x) => x.type === "year")?.value}-${p.find((x) => x.type === "month")?.value}`;
}

export type VentaRetenida = {
  paymentId: string;
  operatorId: string;
  paidAt: string;
  cobrado: number;
  isr: number;
  iva: number;
  regla: string | null;
};

export type DevolucionRetenida = {
  paymentId: string;
  operatorId: string;
  confirmadoAt: string;
  monto: number;
  /** De la venta original, para prorratear. */
  cobradoVenta: number;
  isrVenta: number;
  ivaVenta: number;
};

export type OperadoraFiscal = {
  id: string;
  nombre: string;
  rfc: string | null;
  tipoPersona: string | null;
  curp: string | null;
  domicilio: Domicilio | null;
  banco: string | null;
  clabe: string | null;
};

export type RenglonOperadora = {
  operatorId: string;
  nombre: string;
  rfc: string | null;
  curp: string | null;
  domicilio: string | null;
  banco: string | null;
  clabe: string | null;
  ventas: number;
  /** Cobrado CON IVA, neto de devoluciones del mes. */
  cobrado: number;
  base: number;
  ivaCobrado: number;
  isrRetenido: number;
  ivaRetenido: number;
  devuelto: number;
  /** Datos que la informativa pide y no tenemos. Vacío = completa. */
  faltan: string[];
};

export type ReporteMes = {
  mes: string;
  renglones: RenglonOperadora[];
  totales: { cobrado: number; base: number; ivaCobrado: number; isrRetenido: number; ivaRetenido: number; devuelto: number };
  detalle: { tipo: "venta" | "devolucion"; paymentId: string; operatorId: string; fecha: string; monto: number; isr: number; iva: number }[];
};

/** Base sin IVA y el IVA, con el mismo redondeo que la retención (retencion.ts). */
const partir = (conIva: number) => {
  const base = r2(conIva / (1 + IVA));
  return { base, iva: r2(conIva - base) };
};

/** Lo armado, puro: el servidor sólo trae las filas. */
export function armarReporte(
  mes: string,
  operadoras: OperadoraFiscal[],
  ventas: VentaRetenida[],
  devoluciones: DevolucionRetenida[],
): ReporteMes {
  const vDelMes = ventas.filter((v) => mesCdmx(v.paidAt) === mes);
  const dDelMes = devoluciones.filter((d) => mesCdmx(d.confirmadoAt) === mes);
  const detalle: ReporteMes["detalle"] = [];

  const acum = new Map<string, { ventas: number; cobrado: number; isr: number; iva: number; devuelto: number }>();
  const de = (id: string) => {
    if (!acum.has(id)) acum.set(id, { ventas: 0, cobrado: 0, isr: 0, iva: 0, devuelto: 0 });
    return acum.get(id)!;
  };

  for (const v of vDelMes) {
    const a = de(v.operatorId);
    a.ventas += 1;
    a.cobrado += v.cobrado;
    a.isr += v.isr;
    a.iva += v.iva;
    detalle.push({ tipo: "venta", paymentId: v.paymentId, operatorId: v.operatorId, fecha: v.paidAt, monto: r2(v.cobrado), isr: r2(v.isr), iva: r2(v.iva) });
  }
  for (const d of dDelMes) {
    const prop = d.cobradoVenta > 0 ? Math.min(1, d.monto / d.cobradoVenta) : 0;
    const isr = r2(d.isrVenta * prop);
    const iva = r2(d.ivaVenta * prop);
    const a = de(d.operatorId);
    a.cobrado -= d.monto;
    a.devuelto += d.monto;
    a.isr -= isr;
    a.iva -= iva;
    detalle.push({ tipo: "devolucion", paymentId: d.paymentId, operatorId: d.operatorId, fecha: d.confirmadoAt, monto: -r2(d.monto), isr: -isr, iva: -iva });
  }

  // TODAS las operadoras en Connect, aunque el mes vaya en cero (18-J III).
  const renglones: RenglonOperadora[] = operadoras.map((o) => {
    const a = acum.get(o.id) ?? { ventas: 0, cobrado: 0, isr: 0, iva: 0, devuelto: 0 };
    const cobrado = r2(a.cobrado);
    const { base, iva } = partir(cobrado);
    const faltan: string[] = [];
    if (!o.rfc) faltan.push("RFC");
    if (o.tipoPersona === "fisica" && !o.curp) faltan.push("CURP");
    if (!o.domicilio) faltan.push("domicilio fiscal");
    if (!o.banco) faltan.push("banco");
    if (!o.clabe) faltan.push("CLABE");
    const d = o.domicilio;
    return {
      operatorId: o.id,
      nombre: o.nombre,
      rfc: o.rfc,
      curp: o.curp,
      domicilio: d
        ? [
            [d.calle, d.numeroExterior, d.numeroInterior ? `int. ${d.numeroInterior}` : null].filter(Boolean).join(" "),
            d.colonia,
            d.localidad,
            d.municipio,
            d.estado,
            d.codigoPostal ? `C.P. ${d.codigoPostal}` : null,
          ]
            .filter(Boolean)
            .join(", ")
        : null,
      banco: o.banco,
      clabe: o.clabe,
      ventas: a.ventas,
      cobrado,
      base,
      ivaCobrado: iva,
      isrRetenido: r2(a.isr),
      ivaRetenido: r2(a.iva),
      devuelto: r2(a.devuelto),
      faltan,
    };
  });

  const suma = (k: keyof ReporteMes["totales"]) => r2(renglones.reduce((n, x) => n + (x[k] as number), 0));
  detalle.sort((x, y) => x.fecha.localeCompare(y.fecha));
  return {
    mes,
    renglones,
    totales: {
      cobrado: suma("cobrado"),
      base: suma("base"),
      ivaCobrado: suma("ivaCobrado"),
      isrRetenido: suma("isrRetenido"),
      ivaRetenido: suma("ivaRetenido"),
      devuelto: suma("devuelto"),
    },
    detalle,
  };
}

const celda = (v: unknown): string => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** El CSV para Marisol: un renglón por operadora, con todo lo que pide la informativa. */
export function csvDelReporte(r: ReporteMes): string {
  const cab = [
    "mes", "operadora", "rfc", "curp", "domicilio_fiscal", "banco", "clabe",
    "ventas", "cobrado_con_iva", "base_sin_iva", "iva_cobrado", "isr_retenido", "iva_retenido", "devoluciones", "faltan",
  ];
  const filas = r.renglones.map((x) =>
    [
      r.mes, x.nombre, x.rfc, x.curp, x.domicilio, x.banco, x.clabe,
      x.ventas, x.cobrado.toFixed(2), x.base.toFixed(2), x.ivaCobrado.toFixed(2),
      x.isrRetenido.toFixed(2), x.ivaRetenido.toFixed(2), x.devuelto.toFixed(2), x.faltan.join("; "),
    ].map(celda).join(","),
  );
  const t = r.totales;
  filas.push(
    [r.mes, "TOTAL", "", "", "", "", "", r.renglones.reduce((n, x) => n + x.ventas, 0),
      t.cobrado.toFixed(2), t.base.toFixed(2), t.ivaCobrado.toFixed(2), t.isrRetenido.toFixed(2),
      t.ivaRetenido.toFixed(2), t.devuelto.toFixed(2), ""].map(celda).join(","),
  );
  // BOM para que Excel abra los acentos bien.
  return "﻿" + [cab.join(","), ...filas].join("\n") + "\n";
}

/** El detalle venta por venta, para conciliar contra Stripe. */
export function csvDelDetalle(r: ReporteMes, nombres: Map<string, string>): string {
  const cab = ["mes", "tipo", "fecha", "operadora", "payment_id", "monto_con_iva", "isr", "iva"];
  const filas = r.detalle.map((d) =>
    [r.mes, d.tipo, d.fecha, nombres.get(d.operatorId) ?? d.operatorId, d.paymentId, d.monto.toFixed(2), d.isr.toFixed(2), d.iva.toFixed(2)].map(celda).join(","),
  );
  return "﻿" + [cab.join(","), ...filas].join("\n") + "\n";
}
