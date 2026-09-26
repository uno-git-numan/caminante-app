// LA ATRIBUCIÓN (0071) — lo puro: quién puede tener qué, y cómo se lee el libro.
//
// Luis (25 sep 2026): las solicitudes son libres, todo es transferible, y lo
// devengado es de quien lo tenía ese día. Lo que se afirma aquí es que la
// puerta para tener algo es una sola (tomar, asignar y recibir pasan por
// `puedeTener`) y que el libro contesta «quién lo tenía el día X» sin
// reconstruir nada.
import { describe, expect, it } from "vitest";
import { aQuienPaso, carteraDe, lineaDeHoy, puedeTener, titularEn, type FilaLibro } from "@/lib/equipo/atribucion-reglas";

const ana = { id: "ana", activo: true, numan: true, facultades: ["onboarding"], operadoras: [] };
const diego = { id: "diego", activo: true, numan: false, facultades: ["clientes", "armar"], operadoras: [{ id: "cam" }] };
const paula = { id: "paula", activo: true, numan: true, facultades: ["onboarding", "clientes"], operadoras: [{ id: "cam" }, { id: "ken" }] };

describe("puedeTener: una sola puerta", () => {
  it("lo de numan exige numan + onboarding; lo de una operadora exige trabajar para ESA operadora + clientes", () => {
    expect(puedeTener(ana, "solicitud", null)).toBe(true);
    expect(puedeTener(ana, "operadora", null)).toBe(true);
    expect(puedeTener(ana, "tarjeta", "cam")).toBe(false);
    expect(puedeTener(diego, "tarjeta", "cam")).toBe(true);
    expect(puedeTener(diego, "tarjeta", "ken")).toBe(false);
    expect(puedeTener(diego, "solicitud", null)).toBe(false);
    expect(puedeTener(paula, "grupo", "ken")).toBe(true);
    expect(puedeTener(paula, "operadora", null)).toBe(true);
  });
  it("sin facultad, sin operadora conocida o inactivo: no", () => {
    expect(puedeTener({ ...diego, facultades: ["armar"] }, "tarjeta", "cam")).toBe(false);
    expect(puedeTener(diego, "tarjeta", null)).toBe(false);
    expect(puedeTener({ ...ana, activo: false }, "solicitud", null)).toBe(false);
    expect(puedeTener(null, "solicitud", null)).toBe(false);
  });
});

const libro: FilaLibro[] = [
  { id: "1", staff_id: "ana", objeto: "solicitud", objeto_id: "s1", desde: "2026-09-01T10:00:00Z", hasta: "2026-09-10T10:00:00Z", cierre: "resuelta" },
  { id: "2", staff_id: "ana", objeto: "operadora", objeto_id: "nomadika", desde: "2026-09-10T10:00:00Z", hasta: "2026-09-20T10:00:00Z", cierre: "baja" },
  { id: "3", staff_id: "paula", objeto: "operadora", objeto_id: "nomadika", desde: "2026-09-20T10:00:00Z", hasta: null, cierre: null },
  { id: "4", staff_id: "diego", objeto: "tarjeta", objeto_id: "t1", desde: "2026-09-05T10:00:00Z", hasta: null, cierre: null },
  { id: "5", staff_id: "diego", objeto: "grupo", objeto_id: "g1", desde: "2026-09-06T10:00:00Z", hasta: "2026-09-07T10:00:00Z", cierre: "transferencia" },
  { id: "6", staff_id: "paula", objeto: "grupo", objeto_id: "g1", desde: "2026-09-07T10:00:00Z", hasta: null, cierre: null },
];

describe("el libro", () => {
  it("la cartera son las filas abiertas, por objeto", () => {
    expect(carteraDe(libro, "paula")).toEqual({ solicitud: [], operadora: ["nomadika"], tarjeta: [], grupo: ["g1"] });
    expect(carteraDe(libro, "ana")).toEqual({ solicitud: [], operadora: [], tarjeta: [], grupo: [] });
  });
  it("«quién la tenía el día X» es una consulta por tramo, con el corte en el instante exacto", () => {
    expect(titularEn(libro, "operadora", "nomadika", "2026-09-15T00:00:00Z")).toBe("ana");
    expect(titularEn(libro, "operadora", "nomadika", "2026-09-20T10:00:00Z")).toBe("paula");
    expect(titularEn(libro, "operadora", "nomadika", "2026-09-09T00:00:00Z")).toBe(null);
    expect(titularEn(libro, "grupo", "g1", "2026-09-06T12:00:00Z")).toBe("diego");
  });
  it("a quién pasó la cartera de quien se fue se DERIVA de las filas cerradas por baja", () => {
    expect(aQuienPaso(libro, "ana")).toEqual(["paula"]);
    expect(aQuienPaso(libro, "diego")).toEqual([]);
  });
});

describe("la línea «Hoy»", () => {
  const vacia = { solicitud: [], operadora: [], tarjeta: [], grupo: [] };
  it("dice la verdad cuando no hay nada, por lado", () => {
    expect(lineaDeHoy(vacia, { numan: true, operadora: false })).toBe("Todavía sin operadoras en su cartera");
    expect(lineaDeHoy(vacia, { numan: false, operadora: true })).toBe("Todavía sin tarjetas");
    expect(lineaDeHoy(vacia, { numan: true, operadora: true })).toBe("Todavía sin operadoras en su cartera · todavía sin tarjetas");
  });
  it("cuenta en singular y plural, y suma las solicitudes en curso", () => {
    expect(lineaDeHoy({ ...vacia, operadora: ["a"], solicitud: ["s", "t"] }, { numan: true, operadora: false })).toBe("1 operadora en su cartera · 2 solicitudes en curso");
    expect(lineaDeHoy({ ...vacia, tarjeta: ["a", "b"], grupo: ["g"] }, { numan: false, operadora: true })).toBe("2 tarjetas abiertas · 1 grupo");
  });
});
