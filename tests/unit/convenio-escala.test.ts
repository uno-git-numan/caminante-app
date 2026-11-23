// FIRMAR LA TARIFA DE LA CASA NO ES FIRMAR UN PORCENTAJE.
//
// El convenio congela lo que se cobra. Hasta la 0062 sólo sabía congelar un
// NÚMERO, y `firmarConvenio` se negaba en cuanto `commission_pct` venía en
// NULL — dando por hecho que NULL significa «sin comisión». Es falso: NULL es
// «la tarifa de la casa», que desde el 23 nov de 2026 son DOS tasas fijas
// (8 % si la operadora trae al cliente, 12 % si lo trae Caminante).
//
// Lo que estas pruebas afirman es POR QUÉ no basta con escribirle un número:
// un plano no distingue quién trajo al cliente. Los números salen del motor
// que cobra, no de esta prueba.
import { describe, expect, it } from "vitest";
import { comisionDeVenta, sinIva, TASA_PCT } from "@/lib/operadores/comision";
import { escalaPara } from "@/lib/operadores/atribucion";

const uno = (precio: number) => ({ viaje: { precioUnitario: sinIva(precio), cantidad: 1 } });
const porTarifa = (precio: number, escala: "venta" | "plataforma") =>
  comisionDeVenta(uno(precio), { tipo: "escala", escala }).monto;
const porPlano = (precio: number, pct: number) =>
  comisionDeVenta(uno(precio), { tipo: "plano", pct }).monto;

describe("la tarifa de la casa y un porcentaje plano no son lo mismo", () => {
  it("un plano de 8 coincide cuando ella trae al cliente, y cobra de menos cuando lo trae Caminante", () => {
    expect(porPlano(1750, TASA_PCT.plataforma)).toBe(porTarifa(1750, "plataforma"));
    expect(porPlano(1750, TASA_PCT.plataforma)).toBeLessThan(porTarifa(1750, "venta"));
  });

  it("un plano de 12 le cobraría de más cada vez que ella trae a su propio cliente", () => {
    expect(porPlano(12000, TASA_PCT.venta)).toBe(porTarifa(12000, "venta"));
    expect(porPlano(12000, TASA_PCT.venta)).toBeGreaterThan(porTarifa(12000, "plataforma"));
  });
});

describe("cuál de las dos tasas aplica NO es del operador, es de cada venta", () => {
  // Por eso el convenio congela el TIPO de trato y no una de las dos tasas:
  // fijar «plataforma» en el papel sería prometer algo que el cobro no cumple.
  const OP = "op-1";

  it("si el operador trajo al cliente, paga la de plataforma", () => {
    expect(escalaPara(OP, OP)).toBe("plataforma");
  });

  it("si lo trajo Caminante —o no hay atribución—, la de venta", () => {
    expect(escalaPara(OP, "otro")).toBe("venta");
    expect(escalaPara(OP, null)).toBe("venta");
  });

  it("una experiencia de la casa siempre va por la de venta", () => {
    expect(escalaPara(null, OP)).toBe("venta");
  });

  it("y las dos tasas dan números distintos para la misma venta", () => {
    const v = comisionDeVenta(uno(12000), { tipo: "escala", escala: "venta" }).monto;
    const p = comisionDeVenta(uno(12000), { tipo: "escala", escala: "plataforma" }).monto;
    expect(v).not.toBe(p);
    expect(p).toBeLessThan(v); // el operador que trae a su cliente paga menos
  });
});
