// LO QUE LE TOCA A LA OPERADORA DE CADA PAGO.
//
// Es la aritmética que decide cuánto dinero sale del banco hacia otra persona,
// así que es la que no puede estar mal. La consulta a la base no se prueba aquí
// —eso es el guion de aceptación— pero la resta sí, y en los casos donde se
// equivoca la gente: una devolución parcial de por medio.
import { describe, expect, it } from "vitest";
import { netoDelPago } from "@/lib/operadores/liquidaciones";

const neto = (cobradoMxn: number, devueltoMxn: number, comisionMxn: number) =>
  netoDelPago({ cobradoMxn, devueltoMxn, comisionMxn });

describe("el neto de un pago sin devoluciones", () => {
  it("es lo cobrado menos la comisión", () => {
    // La venta real de `corral-de-piedra`: $1,750 con $301.72 de comisión.
    expect(neto(1750, 0, 301.72)).toBe(1448.28);
  });

  it("las 12 ventas de Nomádika suman lo que se midió en producción", () => {
    const total = Array.from({ length: 12 }, () => neto(1750, 0, 301.72)).reduce((a, b) => a + b, 0);
    // $21,000 cobrados − $3,620.64 de comisión.
    expect(Math.round(total * 100) / 100).toBe(17379.36);
  });

  it("sin comisión pactada, le toca todo", () => {
    expect(neto(1750, 0, 0)).toBe(1750);
  });
});

describe("con una devolución de por medio", () => {
  // ⚠️ AQUÍ ES DONDE SE EQUIVOCA LA GENTE. La comisión NO se resta completa
  // cuando hubo devolución parcial: Stripe la devolvió en la misma proporción
  // (medido el 23 sep 2026 — un refund del 50% devolvió el 50% de la comisión).
  // Restarla entera le quitaría a la operadora dinero que Caminante tampoco se
  // quedó.
  it("devuelto el 50%: le toca la mitad del neto, no el neto menos la comisión entera", () => {
    expect(neto(1750, 875, 301.72)).toBe(724.14);
    expect(neto(1750, 875, 301.72)).toBe(1448.28 / 2);
    // El error clásico: 875 − 301.72 = 573.28. Son $150.86 de menos.
    expect(neto(1750, 875, 301.72)).not.toBe(573.28);
  });

  it("devuelto todo: no le toca nada", () => {
    expect(neto(1750, 1750, 301.72)).toBe(0);
  });

  it("una devolución mayor que lo cobrado no vuelve negativo el neto", () => {
    // La base lo impide (0063), pero un dato viejo o un redondeo no deben
    // producir una transferencia negativa.
    expect(neto(1750, 2000, 301.72)).toBe(0);
  });

  it("proporciones feas: lo que se queda menos su comisión, al centavo", () => {
    for (const pct of [0.3, 0.33, 0.7]) {
      const devuelto = Math.round(1750 * pct * 100) / 100;
      const n = neto(1750, devuelto, 301.72);
      const sequedo = Math.round((1750 - devuelto) * 100) / 100;
      const comision = Math.round(((301.72 * sequedo) / 1750) * 100) / 100;
      expect(n).toBe(Math.round((sequedo - comision) * 100) / 100);
    }
  });
});

describe("casos que no deben producir una transferencia", () => {
  it("un pago de cero", () => {
    expect(neto(0, 0, 0)).toBe(0);
  });

  it("un monto negativo", () => {
    expect(neto(-100, 0, 0)).toBe(0);
  });

  // La comisión nunca debería pasar de lo cobrado (el tope es 20%), pero si un
  // dato viejo lo hiciera, el resultado no puede ser una transferencia al revés.
  it("una comisión mayor que lo cobrado no le cobra a la operadora", () => {
    expect(neto(100, 0, 500)).toBeLessThanOrEqual(0);
  });
});
