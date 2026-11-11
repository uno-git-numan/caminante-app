// EL REPORTE MENSUAL DE RETENCIONES (lib/fiscal/reporte-retenciones.ts).
// Reglas de design/legal/REPORTE-MENSUAL-RETENCIONES-2026-11-12.md: corte al
// emitir, sin operadoras en cero, txt PTEv2 en pesos enteros.
import { describe, expect, it } from "vitest";
import { armarReporte, csvDelReporte, mesCdmx, txtInformativa, type OperadoraFiscal } from "@/lib/fiscal/reporte-retenciones";

const nomadika: OperadoraFiscal = {
  id: "op-n",
  nombre: "Laura Catalina Romero Barragán",
  rfc: "ROBL990531HI3",
  tipoPersona: "fisica",
  curp: "ROBL990531MQTMRR09",
  domicilio: { calle: "Av. Juárez", numeroExterior: "10", numeroInterior: null, colonia: "Centro", localidad: null, municipio: "Querétaro", estado: "QUERÉTARO", codigoPostal: "76230" },
  banco: "BBVA MEXICO",
  clabe: "012180001234567891",
};
const sinDatos: OperadoraFiscal = { id: "op-x", nombre: "Otra", rfc: "XAXX010101000", tipoPersona: "fisica", curp: null, domicilio: null, banco: null, clabe: null };

const venta = (id: string, paidAt: string, op = "op-n") => ({
  paymentId: id, operatorId: op, paidAt, cobrado: 1750, isr: 37.72, iva: 120.69, comision: 301.72, regla: "2026:isr=0.025;iva=0.5;rfc",
});
const CORTE = new Date("2026-12-05T18:00:00Z");

describe("mesCdmx", () => {
  it("el 1 dic 03:00 UTC todavía es noviembre en la CDMX", () => {
    expect(mesCdmx("2026-12-01T03:00:00Z")).toBe("2026-11");
    expect(mesCdmx("2026-12-01T07:00:00Z")).toBe("2026-12");
  });
});

describe("armarReporte", () => {
  it("dos ventas de $1,750: base, IVA, retenciones y comisión del mes", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z"), venta("p2", "2026-11-20T18:00:00Z")], [], CORTE);
    expect(r.renglones[0]).toMatchObject({ ventas: 2, base: 3017.24, ivaCobrado: 482.76, isrRetenido: 75.44, ivaRetenido: 241.38, comision: 603.44, faltan: [] });
    expect(r.detalle[0].comisionPct).toBe(20);
  });

  it("una venta de otro mes no cuenta", () => {
    expect(armarReporte("2026-11", [nomadika], [venta("p1", "2026-10-31T18:00:00Z")], [], CORTE).renglones).toHaveLength(0);
  });

  it("devolución parcial ANTES del corte: se neta en su venta, en proporción", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z")], [
      { paymentId: "p1", confirmadoAt: "2026-12-02T18:00:00Z", monto: 875 },
    ], CORTE);
    expect(r.detalle[0]).toMatchObject({ devuelto: 875, neto: 875, base: 754.31, isr: 18.86, iva: 60.35, seReporta: true });
    expect(r.totales.devueltoNetado).toBe(875);
  });

  it("devolución total antes del corte: la venta NO se reporta y la operadora no aparece", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z")], [
      { paymentId: "p1", confirmadoAt: "2026-11-10T18:00:00Z", monto: 1750 },
    ], CORTE);
    expect(r.detalle[0].seReporta).toBe(false);
    expect(r.renglones).toHaveLength(0);
  });

  it("devolución DESPUÉS del corte no toca el mes: queda a favor de la operadora (Quinta §4)", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z")], [
      { paymentId: "p1", confirmadoAt: "2026-12-20T18:00:00Z", monto: 1750 },
    ], CORTE);
    expect(r.renglones[0]).toMatchObject({ ventas: 1, isrRetenido: 37.72 });
  });

  it("operadora sin ventas en el mes NO va (el SAT no acepta ceros)", () => {
    const r = armarReporte("2026-11", [nomadika, sinDatos], [venta("p1", "2026-11-05T18:00:00Z")], [], CORTE);
    expect(r.renglones.map((x) => x.operatorId)).toEqual(["op-n"]);
  });

  it("lo que falta para la informativa se dice, no se rellena", () => {
    const r = armarReporte("2026-11", [sinDatos], [venta("p9", "2026-11-05T18:00:00Z", "op-x")], [], CORTE);
    expect(r.renglones[0].faltan).toEqual(["CURP", "domicilio fiscal", "banco", "CLABE"]);
  });
});

describe("txtInformativa (carga masiva PTEv2)", () => {
  it("una línea por operadora, «|», pesos enteros, tipo 5 y TA4, sin encabezado", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z"), venta("p2", "2026-11-20T18:00:00Z")], [], CORTE);
    expect(txtInformativa(r)).toEqual({
      txt: "5|ROBL990531HI3|3017|3017|75|241|012180001234567891|TA4\n",
      fuera: [],
    });
  });
  it("sin RFC no entra, y se dice", () => {
    const r = armarReporte("2026-11", [{ ...sinDatos, rfc: null }], [venta("p9", "2026-11-05T18:00:00Z", "op-x")], [], CORTE);
    expect(txtInformativa(r).fuera).toEqual([{ nombre: "Otra", porque: "sin RFC" }]);
  });
});

describe("csvDelReporte", () => {
  it("BOM para Excel, encabezado, un renglón por operadora y el total", () => {
    const csv = csvDelReporte(armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z")], [], CORTE));
    expect(csv.startsWith("﻿mes,operadora,rfc,curp")).toBe(true);
    const l = csv.trim().split("\n");
    expect(l).toHaveLength(3);
    expect(l[1]).toContain('"Av. Juárez 10, Centro, Querétaro, QUERÉTARO, C.P. 76230"');
    expect(l[2]).toContain("TOTAL");
  });
});
