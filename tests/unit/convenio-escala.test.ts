// FIRMAR LA ESCALA NO ES FIRMAR UN 20%.
//
// El convenio congela lo que se cobra. Hasta hoy sólo sabía congelar un
// NÚMERO, y por eso `firmarConvenio` se negaba en cuanto `commission_pct`
// venía en NULL — dando por hecho que NULL significa «sin comisión». Es falso
// desde que existe la escala, y dejaba sin poder firmar justo a la única
// operadora que ya generó comisión.
//
// Lo que estas pruebas afirman es POR QUÉ no bastaba con escribirle un 20: la
// escala es marginal por tramos, así que un plano 20% coincide sólo en el
// primer tramo y de ahí cobra de más. Los números salen del motor que cobra,
// no de esta prueba.
import { describe, expect, it } from "vitest";
import { comisionDeVenta, sinIva, IVA, tramosPara } from "@/lib/operadores/comision";
import { escalaPara } from "@/lib/operadores/atribucion";

const r2 = (x: number) => Math.round(x * 100) / 100;
const uno = (precio: number) => ({ viaje: { precioUnitario: sinIva(precio), cantidad: 1 } });
const porEscala = (precio: number) =>
  comisionDeVenta(uno(precio), { tipo: "escala", escala: "venta" }).monto;
const porPlano = (precio: number, pct: number) =>
  comisionDeVenta(uno(precio), { tipo: "plano", pct }).monto;

describe("la escala y un 20% plano no son lo mismo", () => {
  it("en el primer tramo coinciden — y por eso el error se ve inofensivo", () => {
    // $1,750 es el precio de `corral-de-piedra`, las 12 ventas de Nomádika.
    expect(porEscala(1750)).toBe(porPlano(1750, 20));
    expect(porEscala(1750)).toBe(301.72);
  });

  it("arriba del primer tramo, el plano cobra de más, y crece", () => {
    const deMas = (precio: number) => r2(porPlano(precio, 20) - porEscala(precio));
    expect(deMas(6000)).toBe(43.45);
    expect(deMas(12000)).toBe(193.8);
    expect(deMas(21000)).toBe(566.21);
    // Lo que de verdad sale del bolsillo de la operadora lleva IVA encima: la
    // retención de Stripe es comisión × 1.16.
    expect(r2(deMas(21000) * (1 + IVA))).toBe(656.8);
  });

  it("la escala BAJA por tramos; un plano es una recta", () => {
    const tasas = tramosPara("venta").map((t) => t.pct);
    expect(tasas[0]).toBeGreaterThan(tasas[tasas.length - 1]);
    // Y por eso el porcentaje efectivo de la escala baja conforme sube el precio.
    const efectivo = (precio: number) => porEscala(precio) / sinIva(precio);
    expect(efectivo(21000)).toBeLessThan(efectivo(1750));
  });
});

describe("cuál escala aplica NO es del operador, es de cada venta", () => {
  // Por eso el convenio congela el TIPO de trato y no una de las dos tablas:
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

  it("y las dos tablas dan números distintos para la misma venta", () => {
    const v = comisionDeVenta(uno(12000), { tipo: "escala", escala: "venta" }).monto;
    const p = comisionDeVenta(uno(12000), { tipo: "escala", escala: "plataforma" }).monto;
    expect(v).not.toBe(p);
    expect(p).toBeLessThan(v); // el operador que trae a su cliente paga menos
  });
});
