// LAS COMISIONES DEL EQUIPO (F3) — lo puro: el 10% sigue al libro por tramo, el
// 3% sigue a la salida ya ocurrida, las devoluciones restan en proporción, y
// lo que no tiene dato sale null, nunca cero.
import { describe, expect, it } from "vitest";
import { caidasPorMotivo, claveMes, comisionCaminante, comisionNuman, mesesDesde, netoDe, npsDe, rangoMes, type PagoParaComision } from "@/lib/equipo/comisiones";
import type { FilaLibro } from "@/lib/equipo/atribucion-reglas";

const libro: FilaLibro[] = [
  { id: "1", staff_id: "ana", objeto: "operadora", objeto_id: "nomadika", desde: "2026-09-01T06:00:00Z", hasta: "2026-09-20T06:00:00Z", cierre: "baja" },
  { id: "2", staff_id: "paula", objeto: "operadora", objeto_id: "nomadika", desde: "2026-09-20T06:00:00Z", hasta: null, cierre: null },
];
const pago = (o: Partial<PagoParaComision>): PagoParaComision => ({
  id: "p", paid_at: "2026-09-10T12:00:00Z", amount_mxn: 1750, refunded_mxn: 0, platform_fee_mxn: 301.72,
  operator_id: "nomadika", vendedor_id: null, slot_starts_at: null, num_people: 1, etiqueta: "Nomádika", ...o,
});
const sep = mesesDesde("2026-09", new Date("2026-09-26T18:00:00Z")).find((m) => m.k === "2026-09")!;

describe("meses y rangos en CDMX", () => {
  it("el mes va de las 00:00 CDMX del 1 a las 00:00 CDMX del 1 siguiente (UTC−6)", () => {
    expect(rangoMes("2026-09")).toEqual({ desde: "2026-09-01T06:00:00.000Z", hasta: "2026-10-01T06:00:00.000Z" });
    expect(claveMes("2026-10-01T05:59:00Z")).toBe("2026-09");
    expect(claveMes("2026-10-01T06:00:00Z")).toBe("2026-10");
  });
  it("desde el primer mes con libro hasta el mes en curso, con el corte el 5 del siguiente", () => {
    const m = mesesDesde("2026-07", new Date("2026-09-26T18:00:00Z"));
    expect(m.map((x) => x.k)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(m[1]).toMatchObject({ t: "Agosto de 2026", m: "agosto", corte: "5 de septiembre", curso: false });
    expect(m[2].curso).toBe(true);
    expect(mesesDesde(null, new Date("2026-09-26T18:00:00Z")).map((x) => x.k)).toEqual(["2026-09"]);
  });
});

describe("netoDe: la comisión sigue a lo que el cliente acabó pagando", () => {
  it("una devolución parcial resta la comisión en la misma proporción", () => {
    expect(netoDe({ amount_mxn: 1000, refunded_mxn: 500, platform_fee_mxn: 200 })).toEqual({ sequedo: 500, sinIva: 431.03, fee: 100, devuelto: 500 });
  });
});

describe("numan: 10% de la comisión, a quien tenía la operadora el día del pago", () => {
  it("el mismo pago va a Ana antes del 20 y a Paula después; la devolución resta", () => {
    const r = comisionNuman([
      pago({ id: "a", paid_at: "2026-09-10T12:00:00Z" }),
      pago({ id: "b", paid_at: "2026-09-25T12:00:00Z", refunded_mxn: 875 }),
      pago({ id: "c", paid_at: "2026-08-25T12:00:00Z" }),
    ], libro, sep);
    expect(r.get("ana")).toMatchObject({ genera: 301.72, dev: 30.17 });
    expect(r.get("paula")).toMatchObject({ genera: 150.86, dev: 15.09 });
    expect(r.get("paula")!.cuenta.map((l) => l.monto)).toEqual([30.17, -15.09]);
  });
  it("un pago sin titular ese día no es de nadie", () => {
    expect(comisionNuman([pago({ paid_at: "2026-09-10T12:00:00Z", operator_id: "otra" })], libro, sep).size).toBe(0);
  });
});

describe("Caminante: 3% del cobrado sin IVA por grupo cerrado", () => {
  const ahora = new Date("2026-09-26T18:00:00Z");
  it("devenga cuando la salida ya ocurrió, en el mes de la salida; lo futuro queda por devengar", () => {
    const r = comisionCaminante([
      pago({ id: "a", vendedor_id: "diego", slot_starts_at: "2026-09-14T12:00:00Z", num_people: 2, amount_mxn: 3500 }),
      pago({ id: "b", vendedor_id: "diego", slot_starts_at: "2026-10-10T12:00:00Z" }),
      pago({ id: "c", vendedor_id: "diego", slot_starts_at: null }),
    ], sep, ahora);
    const d = r.get("diego")!;
    expect(d.lugares).toBe(4);
    expect(d.monto).toBe(6034.48);
    expect(d.dev).toBe(90.52);
    expect(d.porDev).toBe(45.26);
    expect(d.sinFecha).toBe(45.26);
  });
  it("un pago sin vendedor no cuenta para nadie", () => {
    expect(comisionCaminante([pago({ slot_starts_at: "2026-09-14T12:00:00Z" })], sep, ahora).size).toBe(0);
  });
});

describe("lo que no tiene dato sale null, no cero", () => {
  it("NPS", () => {
    expect(npsDe([])).toBe(null);
    expect(npsDe([10, 9, 7, 3])).toBe(25);
  });
  it("caídas por motivo, de más a menos", () => {
    expect(caidasPorMotivo(["Precio", "Fecha", "Precio", null])).toEqual([["Precio", 2], ["Fecha", 1], ["Sin motivo", 1]]);
  });
});
