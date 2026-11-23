// EL DESGLOSE POR VENTA QUE VE LA OPERADORA (convenio v3.5, Tercera §7 y
// Cuarta §4): origen y tasa aplicada, con lo congelado en el pago.
import { describe, expect, it } from "vitest";
import { desgloseDeVenta } from "@/lib/payments/desglose-venta";

describe("desgloseDeVenta", () => {
  it("venta de $1,750 que trajo la operadora, cobrada por su cuenta: 8 %, $140 con IVA, y le llegan $1,451.60", () => {
    const d = desgloseDeVenta({
      amount_mxn: 1750,
      platform_fee_mxn: 120.69,
      fee_retenido_mxn: 140,
      isr_retenido_mxn: 37.71,
      iva_retenido_mxn: 120.69,
      escala_comision: "plataforma",
    });
    expect(d).toMatchObject({
      cobrado: 1750,
      origen: "operadora",
      origenTexto: "La trajiste tú",
      tasaPct: 8,
      comision: 120.69,
      ivaComision: 19.31,
      retenciones: 158.4,
      recibes: 1451.6,
    });
  });

  it("la misma venta, traída por Caminante: 12 %, $209.99 con IVA, y le llegan $1,381.61", () => {
    const d = desgloseDeVenta({
      amount_mxn: 1750,
      platform_fee_mxn: 181.03,
      fee_retenido_mxn: 209.99,
      isr_retenido_mxn: 37.71,
      iva_retenido_mxn: 120.69,
      escala_comision: "venta",
    });
    expect(d.origen).toBe("caminante");
    expect(d.tasaPct).toBe(12);
    expect(d.ivaComision).toBe(28.96);
    expect(d.recibes).toBe(1381.61);
  });

  it("una venta vieja, de cuando había escala, dice la tasa que DE VERDAD se le cobró (20 %), no la de hoy", () => {
    // Las 12 ventas de Nomádika de septiembre: $301.72 de comisión sobre $1,750.
    const d = desgloseDeVenta({ amount_mxn: 1750, platform_fee_mxn: 301.72 });
    expect(d.tasaPct).toBe(20);
    expect(d.comision).toBe(301.72);
    // Cobrada por el camino de la casa: el retenido se deriva (comisión × 1.16).
    expect(d.ivaComision).toBe(48.28);
    expect(d.recibes).toBe(1400);
    // Y su origen no se guardó: se dice, no se adivina.
    expect(d.origen).toBe("sin-registro");
  });

  it("un porcentaje pactado congelado en la venta se dice como pactado", () => {
    const d = desgloseDeVenta({ amount_mxn: 1160, platform_fee_mxn: 200, commission_pct: 20 });
    expect(d.origen).toBe("pactada");
    expect(d.tasaPct).toBe(20);
  });

  it("sin comisión congelada no se inventa una: le llega todo y no hay tasa", () => {
    const d = desgloseDeVenta({ amount_mxn: 5000, platform_fee_mxn: null, escala_comision: "venta" });
    expect(d).toMatchObject({ origen: "sin-comision", tasaPct: null, comision: 0, ivaComision: 0, recibes: 5000 });
  });

  it("lo que suma siempre cierra: cobrado = comisión + IVA + retenciones + lo que recibe", () => {
    for (const v of [
      { amount_mxn: 1750, platform_fee_mxn: 120.69, fee_retenido_mxn: 140, isr_retenido_mxn: 37.71, iva_retenido_mxn: 120.69 },
      { amount_mxn: 32197, platform_fee_mxn: 2220.48 },
      { amount_mxn: 5250, platform_fee_mxn: 543.1, fee_retenido_mxn: 630, isr_retenido_mxn: 113.14, iva_retenido_mxn: 362.07 },
    ]) {
      const d = desgloseDeVenta(v);
      expect(Math.round((d.comision + d.ivaComision + d.retenciones + d.recibes) * 100) / 100).toBe(d.cobrado);
    }
  });
});
