// LOS CINCO PASOS DEL ALTA (23 nov 2026) — y los números escritos en sus textos.
//
// Luis: primero lo suyo (marca, experiencia), y los papeles, la firma y la
// cuenta al final. Cada paso sabe solo si está hecho; «aquí estás» es el
// primero que falta.
import { describe, expect, it } from "vitest";
import { ORDINALES, PASOS, pasoActual, pasosHechos, type ParaLosPasos } from "@/lib/operadores/pasos";
import { generalesPara, momentoDeGeneral } from "@/lib/operadores/actividades";

const base: ParaLosPasos = {
  estado: "por_firmar",
  operadora: { marca: { completa: false }, puedeCobrar: false },
  experiencias: [],
  expediente: { completo: false },
  candados: [{ clave: "convenio", cumplido: false }],
};

describe("los cinco pasos del alta", () => {
  it("son cinco, en este orden, y hay un ordinal para cada uno", () => {
    expect(PASOS.map((p) => p.titulo)).toEqual(["Tu marca", "Tu experiencia", "Tus documentos", "El convenio", "Tu cuenta de cobro"]);
    expect(ORDINALES).toHaveLength(PASOS.length);
  });

  it("sin fila de operadora (sigue en su solicitud) no hay paso que enseñar", () => {
    expect(pasoActual({ ...base, operadora: null })).toBe(-1);
  });

  it("recién aprobada empieza por su marca", () => {
    expect(pasoActual(base)).toBe(0);
  });

  it("la marca es opcional: quien ya armó una experiencia no se queda atorada en el 01", () => {
    const d = { ...base, experiencias: [{ estado: "draft" }] };
    expect(pasosHechos(d).slice(0, 2)).toEqual([true, true]);
    expect(pasoActual(d)).toBe(2);
  });

  it("no son fila india: los documentos pueden estar hechos antes que la experiencia", () => {
    const d = { ...base, expediente: { completo: true }, candados: [{ clave: "convenio", cumplido: true }] };
    expect(pasosHechos(d)).toEqual([false, false, true, true, false]);
    expect(pasoActual(d)).toBe(0);
  });

  it("con todo hecho se queda en el último", () => {
    const d: ParaLosPasos = {
      ...base,
      operadora: { marca: { completa: true }, puedeCobrar: true },
      experiencias: [{ estado: "published" }],
      expediente: { completo: true },
      candados: [{ clave: "convenio", cumplido: true }],
    };
    expect(pasosHechos(d)).toEqual([true, true, true, true, true]);
    expect(pasoActual(d)).toBe(4);
  });

  // El paso 03 dice «Dos para vender». Es un número escrito DENTRO de un texto:
  // si legal mueve un documento al arranque, la pantalla mentiría sin fallar.
  it("«Dos para vender» sigue siendo cierto para física y para moral", () => {
    expect(PASOS[2].resumen).toContain("Dos para vender");
    for (const tipo of ["fisica", "moral"] as const) {
      const arranque = generalesPara(tipo).filter((d) => !d.opcional && momentoDeGeneral(d.slug) === "arranque");
      expect(arranque).toHaveLength(2);
    }
  });
});
