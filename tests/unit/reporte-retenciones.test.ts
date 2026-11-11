// EL REPORTE MENSUAL DE RETENCIONES (lib/fiscal/reporte-retenciones.ts).
// Marisol lo pidió para presentar las informativas; es la fuente del entero
// (día 17), del CFDI de retenciones (día 5) y de la informativa 18-J III (día 10).
import { describe, expect, it } from "vitest";
import { armarReporte, csvDelReporte, mesCdmx, type OperadoraFiscal } from "@/lib/fiscal/reporte-retenciones";

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

const venta = (id: string, paidAt: string) => ({ paymentId: id, operatorId: "op-n", paidAt, cobrado: 1750, isr: 37.72, iva: 120.69, regla: "2026:isr=0.025;iva=0.5;rfc" });

describe("mesCdmx", () => {
  it("el 1 dic 03:00 UTC todavía es noviembre en la CDMX", () => {
    expect(mesCdmx("2026-12-01T03:00:00Z")).toBe("2026-11");
    expect(mesCdmx("2026-12-01T07:00:00Z")).toBe("2026-12");
  });
});

describe("armarReporte", () => {
  it("dos ventas de $1,750 en noviembre: suma, base, IVA y retenciones", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z"), venta("p2", "2026-11-20T18:00:00Z")], []);
    expect(r.renglones[0]).toMatchObject({
      ventas: 2, cobrado: 3500, base: 3017.24, ivaCobrado: 482.76, isrRetenido: 75.44, ivaRetenido: 241.38, devuelto: 0, faltan: [],
    });
    expect(r.totales.isrRetenido).toBe(75.44);
  });

  it("una venta de otro mes no cuenta", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-10-31T18:00:00Z")], []);
    expect(r.renglones[0].ventas).toBe(0);
  });

  it("una devolución confirmada en el mes corrige ESE mes, en proporción", () => {
    const r = armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z")], [
      { paymentId: "p1", operatorId: "op-n", confirmadoAt: "2026-11-10T18:00:00Z", monto: 875, cobradoVenta: 1750, isrVenta: 37.72, ivaVenta: 120.69 },
    ]);
    expect(r.renglones[0]).toMatchObject({ cobrado: 875, devuelto: 875, isrRetenido: 18.86, ivaRetenido: 60.34 });
  });

  it("la devolución de una venta de octubre confirmada en noviembre corrige noviembre (octubre ya se presentó)", () => {
    const r = armarReporte("2026-11", [nomadika], [], [
      { paymentId: "p0", operatorId: "op-n", confirmadoAt: "2026-11-03T18:00:00Z", monto: 1750, cobradoVenta: 1750, isrVenta: 37.72, ivaVenta: 120.69 },
    ]);
    expect(r.renglones[0]).toMatchObject({ cobrado: -1750, isrRetenido: -37.72, ivaRetenido: -120.69 });
  });

  it("una operadora sin ventas en el mes VA en el reporte, en cero (18-J III)", () => {
    const r = armarReporte("2026-11", [nomadika, sinDatos], [venta("p1", "2026-11-05T18:00:00Z")], []);
    expect(r.renglones).toHaveLength(2);
    expect(r.renglones[1]).toMatchObject({ ventas: 0, cobrado: 0 });
  });

  it("lo que falta para la informativa se dice, no se rellena", () => {
    const r = armarReporte("2026-11", [sinDatos], [], []);
    expect(r.renglones[0].faltan).toEqual(["CURP", "domicilio fiscal", "banco", "CLABE"]);
  });
});

describe("csvDelReporte", () => {
  it("trae BOM para Excel, encabezado, un renglón por operadora y el total", () => {
    const csv = csvDelReporte(armarReporte("2026-11", [nomadika], [venta("p1", "2026-11-05T18:00:00Z")], []));
    expect(csv.startsWith("﻿mes,operadora,rfc,curp")).toBe(true);
    const lineas = csv.trim().split("\n");
    expect(lineas).toHaveLength(3);
    expect(lineas[1]).toContain("ROBL990531HI3");
    expect(lineas[1]).toContain("37.72");
    expect(lineas[2]).toContain("TOTAL");
  });
  it("escapa comas del domicilio con comillas", () => {
    const csv = csvDelReporte(armarReporte("2026-11", [nomadika], [], []));
    expect(csv).toContain('"Av. Juárez 10, Centro, Querétaro, QUERÉTARO, C.P. 76230"');
  });
});
