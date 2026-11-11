// EL REPORTE MENSUAL DE RETENCIONES (11–12 nov 2026).
//
// Marisol: «Espero que el sistema que utilizas pueda proporcionar el reporte de
// las retenciones del mes para presentar las informativas que se generan.»
//
// Formatos y reglas: design/legal/REPORTE-MENSUAL-RETENCIONES-2026-11-12.md
// (sesión legal, leído de las guías del SAT). De este reporte salen tres cosas:
//
//   A · CFDI de retenciones por operadora (clave 26 + complemento) .. día 5
//   B · Entero del ISR y el IVA retenidos (Marisol) ................ día 17
//   C · Informativa de plataformas, carga masiva por txt (Marisol) .. día 10
//
// ── QUÉ CUENTA EN UN MES (legal §3 y §4) ───────────────────────────────────
//
//   · Las ventas por cuenta conectada COBRADAS en el mes (hora CDMX), cada una
//     con la retención que se congeló al cobrar (0079).
//   · CORTE AL EMITIR: una devolución confirmada ANTES del corte (la emisión
//     del CFDI del mes) se neta en SU venta; si fue total, la venta no se
//     reporta. Una devolución DESPUÉS del corte no toca el mes: lo enterado
//     queda a favor de la operadora (convenio, Quinta §4). El complemento del
//     SAT no admite negativos ni fechas fuera del mes.
//   · Sólo operadoras con al menos una venta reportada: el layout del SAT «no
//     acepta cero» (legal §4).
//
// ⚠️ NADA SE INVENTA: lo que falta para la informativa se lista en `faltan`.

import { IVA } from "@/lib/operadores/comision";
import type { Domicilio } from "@/lib/operadores/fiscal-privado";
import { montosSegunSat, type MontosSat } from "./cfdi-retenciones";
import { TASAS_POR_EJERCICIO } from "./retencion";

const r2 = (n: number) => Math.round(n * 100) / 100;

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
  /** Comisión de NUMAN SIN IVA (platform_fee_mxn), para el complemento. */
  comision: number | null;
  regla: string | null;
  /** payments.medio_pago (card:credit, card:debit, oxxo…). */
  medio?: string | null;
};

export type Devolucion = { paymentId: string; confirmadoAt: string; monto: number };

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

export type VentaDelReporte = {
  paymentId: string;
  operatorId: string;
  fecha: string;
  cobrado: number;
  devuelto: number;
  /** Lo que queda después de las devoluciones dentro del corte. */
  neto: number;
  base: number;
  ivaCobrado: number;
  isr: number;
  iva: number;
  comision: number | null;
  comisionPct: number | null;
  medio: string | null;
  /** false = devuelta completa antes del corte: no se reporta. */
  seReporta: boolean;
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
  base: number;
  ivaCobrado: number;
  isrRetenido: number;
  ivaRetenido: number;
  comision: number;
  /**
   * Lo que dirá el CFDI de retenciones con la regla del SAT (base del mes ×
   * tasa, TRUNCADO): es lo que se ENTERA. Puede diferir unos centavos de
   * `isrRetenido`/`ivaRetenido` (suma por venta); la diferencia la pone NUMAN
   * (legal, M15). null si el ejercicio no tiene tasas.
   */
  sat: MontosSat | null;
  faltan: string[];
};

export type ReporteMes = {
  mes: string;
  corte: string;
  renglones: RenglonOperadora[];
  totales: {
    ventas: number;
    base: number;
    ivaCobrado: number;
    isrRetenido: number;
    ivaRetenido: number;
    devueltoNetado: number;
    /** Lo que se entera el día 17: suma de lo que dicen los CFDI (regla del SAT). */
    isrEnterar: number;
    ivaEnterar: number;
  };
  detalle: VentaDelReporte[];
};

/** Base sin IVA y el IVA, con el mismo redondeo que la retención (retencion.ts). */
const partir = (conIva: number) => {
  const base = r2(conIva / (1 + IVA));
  return { base, iva: r2(conIva - base) };
};

export function armarReporte(
  mes: string,
  operadoras: OperadoraFiscal[],
  ventas: VentaRetenida[],
  devoluciones: Devolucion[],
  corte: Date = new Date(),
  /** El corte de cada operadora con CFDI ya timbrado: su `timbrado_at`. */
  cortePorOperadora: Map<string, string> = new Map(),
): ReporteMes {
  const corteIso = corte.toISOString();
  const opDePago = new Map(ventas.map((v) => [v.paymentId, v.operatorId]));
  const devueltoDe = new Map<string, number>();
  for (const d of devoluciones) {
    const corteOp = cortePorOperadora.get(opDePago.get(d.paymentId) ?? "") ?? corteIso;
    if (d.confirmadoAt > corteOp) continue; // después del corte: no toca el mes
    devueltoDe.set(d.paymentId, (devueltoDe.get(d.paymentId) ?? 0) + d.monto);
  }

  const detalle: VentaDelReporte[] = ventas
    .filter((v) => mesCdmx(v.paidAt) === mes)
    .map((v) => {
      const devuelto = r2(Math.min(v.cobrado, devueltoDe.get(v.paymentId) ?? 0));
      const neto = r2(v.cobrado - devuelto);
      const prop = v.cobrado > 0 ? neto / v.cobrado : 0;
      const { base, iva } = partir(neto);
      const comision = v.comision != null ? r2(v.comision * prop) : null;
      return {
        paymentId: v.paymentId,
        operatorId: v.operatorId,
        fecha: v.paidAt,
        cobrado: r2(v.cobrado),
        devuelto,
        neto,
        base,
        ivaCobrado: iva,
        isr: r2(v.isr * prop),
        iva: r2(v.iva * prop),
        comision,
        comisionPct: comision != null && base > 0 ? r2((comision / base) * 100) : null,
        medio: v.medio ?? null,
        seReporta: neto > 0,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const porOp = new Map<string, VentaDelReporte[]>();
  for (const d of detalle.filter((x) => x.seReporta)) {
    if (!porOp.has(d.operatorId)) porOp.set(d.operatorId, []);
    porOp.get(d.operatorId)!.push(d);
  }
  const ops = new Map(operadoras.map((o) => [o.id, o]));
  const tasas = TASAS_POR_EJERCICIO[Number(mes.slice(0, 4))];

  const renglones: RenglonOperadora[] = [...porOp.entries()]
    .map(([id, vs]) => {
      const o = ops.get(id) ?? { id, nombre: id, rfc: null, tipoPersona: null, curp: null, domicilio: null, banco: null, clabe: null };
      const suma = (k: "base" | "ivaCobrado" | "isr" | "iva") => r2(vs.reduce((n, x) => n + x[k], 0));
      const faltan: string[] = [];
      if (!o.rfc) faltan.push("RFC");
      if (o.tipoPersona === "fisica" && !o.curp) faltan.push("CURP");
      if (!o.domicilio) faltan.push("domicilio fiscal");
      if (!o.banco) faltan.push("banco");
      if (!o.clabe) faltan.push("CLABE");
      const d = o.domicilio;
      return {
        operatorId: id,
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
        ventas: vs.length,
        base: suma("base"),
        ivaCobrado: suma("ivaCobrado"),
        isrRetenido: suma("isr"),
        ivaRetenido: suma("iva"),
        comision: r2(vs.reduce((n, x) => n + (x.comision ?? 0), 0)),
        sat: tasas
          ? montosSegunSat(
              vs.map((x) => ({ paymentId: x.paymentId, fecha: x.fecha.slice(0, 10), base: x.base, comision: x.comision, medio: x.medio })),
              { isr: tasas.isr, iva: tasas.iva },
            )
          : null,
        faltan,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const t = (k: "base" | "ivaCobrado" | "isrRetenido" | "ivaRetenido") => r2(renglones.reduce((n, x) => n + x[k], 0));
  return {
    mes,
    corte: corteIso,
    renglones,
    totales: {
      ventas: renglones.reduce((n, x) => n + x.ventas, 0),
      base: t("base"),
      ivaCobrado: t("ivaCobrado"),
      isrRetenido: t("isrRetenido"),
      ivaRetenido: t("ivaRetenido"),
      devueltoNetado: r2(detalle.reduce((n, x) => n + x.devuelto, 0)),
      isrEnterar: r2(renglones.reduce((n, x) => n + (x.sat?.isr ?? x.isrRetenido), 0)),
      ivaEnterar: r2(renglones.reduce((n, x) => n + (x.sat?.iva ?? x.ivaRetenido), 0)),
    },
    detalle,
  };
}

const celda = (v: unknown): string => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Pesos enteros, como pide el layout del SAT (redondeo al peso). */
const pesos = (n: number) => Math.round(n);

/**
 * El txt de la informativa de plataformas (carga masiva PTEv2, legal §2.1):
 * UTF-8, sin encabezado, una línea por operadora, separado por «|»:
 *   5 | RFC | monto ISR | monto IVA | ISR retenido | IVA retenido | CLABE | TA4
 * Montos en pesos enteros y mayores que cero. «Monto para IVA» = base sin IVA
 * (decisión de legal; M11 para Marisol).
 *
 * @returns el archivo y las operadoras que NO entraron (con por qué): el
 *          layout no acepta ceros y un RFC vacío lo rechaza el SAT.
 */
export function txtInformativa(r: ReporteMes): { txt: string; fuera: { nombre: string; porque: string }[] } {
  const fuera: { nombre: string; porque: string }[] = [];
  const lineas: string[] = [];
  for (const x of r.renglones) {
    const valores = [pesos(x.base), pesos(x.base), pesos(x.isrRetenido), pesos(x.ivaRetenido)];
    if (!x.rfc) {
      fuera.push({ nombre: x.nombre, porque: "sin RFC" });
      continue;
    }
    if (valores.some((v) => v <= 0)) {
      fuera.push({ nombre: x.nombre, porque: "algún monto redondea a cero y el SAT no acepta ceros" });
      continue;
    }
    lineas.push(["5", x.rfc, ...valores.map(String), x.clabe ?? "", "TA4"].join("|"));
  }
  return { txt: lineas.length ? lineas.join("\n") + "\n" : "", fuera };
}

/** El resumen por operadora en CSV (para Marisol y el entero por RFC). */
export function csvDelReporte(r: ReporteMes): string {
  const cab = [
    "mes", "operadora", "rfc", "curp", "domicilio_fiscal", "banco", "clabe",
    "ventas", "base_sin_iva", "iva_cobrado", "isr_retenido", "iva_retenido", "comision_sin_iva", "faltan",
  ];
  const filas = r.renglones.map((x) =>
    [
      r.mes, x.nombre, x.rfc, x.curp, x.domicilio, x.banco, x.clabe, x.ventas,
      x.base.toFixed(2), x.ivaCobrado.toFixed(2), x.isrRetenido.toFixed(2), x.ivaRetenido.toFixed(2),
      x.comision.toFixed(2), x.faltan.join("; "),
    ].map(celda).join(","),
  );
  const t = r.totales;
  filas.push(
    [r.mes, "TOTAL", "", "", "", "", "", t.ventas, t.base.toFixed(2), t.ivaCobrado.toFixed(2),
      t.isrRetenido.toFixed(2), t.ivaRetenido.toFixed(2), r.renglones.reduce((n, x) => n + x.comision, 0).toFixed(2), ""]
      .map(celda).join(","),
  );
  return "﻿" + [cab.join(","), ...filas].join("\n") + "\n";
}

/** El detalle venta por venta (lo que irá al complemento del CFDI de retenciones). */
export function csvDelDetalle(r: ReporteMes, nombres: Map<string, string>): string {
  const cab = [
    "mes", "fecha_cobro", "operadora", "payment_id", "cobrado_con_iva", "devuelto_antes_del_corte", "base_sin_iva",
    "iva_cobrado", "comision_sin_iva", "comision_pct", "isr_retenido", "iva_retenido", "se_reporta",
  ];
  const filas = r.detalle.map((d) =>
    [
      r.mes, d.fecha, nombres.get(d.operatorId) ?? d.operatorId, d.paymentId, d.cobrado.toFixed(2), d.devuelto.toFixed(2),
      d.base.toFixed(2), d.ivaCobrado.toFixed(2), d.comision?.toFixed(2) ?? "", d.comisionPct?.toFixed(2) ?? "",
      d.isr.toFixed(2), d.iva.toFixed(2), d.seReporta ? "sí" : "no (devuelta antes del corte)",
    ].map(celda).join(","),
  );
  return "﻿" + [cab.join(","), ...filas].join("\n") + "\n";
}
