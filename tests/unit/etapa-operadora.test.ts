// EN QUÉ COLUMNA DEL PIPELINE VA UNA OPERADORA.
//
// La regla se deduce del estado real. Estas pruebas fijan los dos errores que
// tenía hasta el 24 sep 2026, los dos en silencio:
//
//   1. «Dormido» se decidía por la antigüedad de la FILA. Kéntro —nunca ha
//      vendido, a medio darse de alta— salía como «lleva dos meses sin vender».
//   2. «Listo» iba antes que «Dormido», así que la operadora para la que existe
//      esa columna —seis candados en verde, dejó de vender— nunca caía en ella.
import { describe, expect, it } from "vitest";
import { etapaDe } from "@/lib/plataforma/etapas";

const AHORA = new Date("2026-09-24T12:00:00Z");
const haceDias = (n: number) => new Date(AHORA.getTime() - n * 86_400_000).toISOString();
const base = { solicitud: null, vendidoMes: 0, ultimaVenta: null, cumplidos: 3, esLaCasa: false, ahora: AHORA };

describe("etapaDe", () => {
  it("EL CASO KÉNTRO: nunca vendió y tiene 3 de 6 ⇒ en su alta, NO dormida", () => {
    // La fila tiene 62 días. Antes eso bastaba para mandarla a «Dormido».
    expect(etapaDe({ ...base, cumplidos: 3, ultimaVenta: null })).toBe("expediente");
  });

  it("vendió y lleva más de 60 días sin vender ⇒ dormida", () => {
    expect(etapaDe({ ...base, ultimaVenta: haceDias(61) })).toBe("dormido");
  });

  it("vendió hace poco y este mes no ⇒ no es dormida todavía", () => {
    expect(etapaDe({ ...base, ultimaVenta: haceDias(40) })).toBe("expediente");
  });

  it("seis candados en verde y dejó de vender ⇒ DORMIDA, no «lista»", () => {
    // Es la operadora para la que existe la columna 06. Con «listo» antes, se
    // quedaba en «Listo para vender» para siempre y nadie se enteraba.
    expect(etapaDe({ ...base, cumplidos: 6, ultimaVenta: haceDias(90) })).toBe("dormido");
  });

  it("seis candados y nunca ha vendido ⇒ lista para vender", () => {
    expect(etapaDe({ ...base, cumplidos: 6 })).toBe("listo");
  });

  it("vendió este mes ⇒ vendiendo, aunque le falten candados", () => {
    expect(etapaDe({ ...base, vendidoMes: 3500, ultimaVenta: haceDias(3) })).toBe("vendiendo");
  });

  it("la casa nunca se duerme", () => {
    expect(etapaDe({ ...base, esLaCasa: true, ultimaVenta: haceDias(200) })).toBe("expediente");
  });

  it("la solicitud manda mientras está en el embudo", () => {
    expect(etapaDe({ ...base, solicitud: "pending" })).toBe("llego");
    expect(etapaDe({ ...base, solicitud: "calling" })).toBe("en_llamada");
    expect(etapaDe({ ...base, solicitud: "rejected", vendidoMes: 900 })).toBe("se_salieron");
  });
});
