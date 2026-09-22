// LO QUE RECIBE CADA QUIEN — las cifras que el panel del operador tiene que
// decir igual que su cuenta de Stripe. Un error aquí no falla: le promete a
// alguien dinero que no va a llegar.
import { describe, expect, it } from "vitest";
import { repartoDe, repartoTotal } from "@/lib/payments/lo-que-recibe";

describe("repartoDe", () => {
  it("cobro por Connect: usa lo que Stripe retuvo DE VERDAD", () => {
    // Medido contra Stripe el 22 sep 2026: su saldo quedó en $1,400.00.
    expect(repartoDe({ amount_mxn: 1750, platform_fee_mxn: 301.72, fee_retenido_mxn: 350 })).toEqual({
      cobrado: 1750,
      retenido: 350,
      recibeOperadora: 1400,
    });
  });

  it("cobro por la casa: deriva el IVA de la comisión congelada", () => {
    // Sin retención automática, lo que Caminante le va a facturar sí lleva IVA.
    expect(repartoDe({ amount_mxn: 1750, platform_fee_mxn: 301.72 })).toEqual({
      cobrado: 1750,
      retenido: 350,
      recibeOperadora: 1400,
    });
  });

  it("lo retenido MANDA sobre lo derivado: es el hecho, no una cuenta", () => {
    // Si alguna vez difieren —una comisión editada después de cobrar— gana lo
    // que de verdad salió de la transferencia.
    const r = repartoDe({ amount_mxn: 1750, platform_fee_mxn: 999, fee_retenido_mxn: 350 });
    expect(r.retenido).toBe(350);
    expect(r.recibeOperadora).toBe(1400);
  });

  it("sin comisión congelada NO se inventa una", () => {
    // Una venta anterior a `comision_desde` no generó comisión. Estimarla aquí
    // le descontaría a la operadora dinero que nadie le cobró.
    expect(repartoDe({ amount_mxn: 1750 })).toEqual({
      cobrado: 1750,
      retenido: 0,
      recibeOperadora: 1750,
    });
  });

  it("tolera numeric de Postgres, que llega como cadena", () => {
    expect(repartoDe({ amount_mxn: "1750.00", fee_retenido_mxn: "350.00" }).recibeOperadora).toBe(1400);
  });

  it("no revienta con nulos ni con basura", () => {
    expect(repartoDe({ amount_mxn: null })).toEqual({ cobrado: 0, retenido: 0, recibeOperadora: 0 });
    expect(repartoDe({ amount_mxn: "x" as unknown as string }).cobrado).toBe(0);
  });
});

describe("repartoTotal", () => {
  it("las 12 ventas de Nomádika: $21,000 cobrados, $4,200 de comisión con IVA, $16,800 para ella", () => {
    const doce = Array.from({ length: 12 }, () => ({
      amount_mxn: 1750,
      platform_fee_mxn: 301.72,
      fee_retenido_mxn: 350,
    }));
    expect(repartoTotal(doce)).toEqual({
      cobrado: 21000,
      retenido: 4200,
      recibeOperadora: 16800,
    });
  });

  it("mezcla los dos canales sin despeinarse", () => {
    const r = repartoTotal([
      { amount_mxn: 1750, fee_retenido_mxn: 350 }, // connect
      { amount_mxn: 1750, platform_fee_mxn: 301.72 }, // casa
      { amount_mxn: 1750 }, // sin comisión
    ]);
    expect(r).toEqual({ cobrado: 5250, retenido: 700, recibeOperadora: 4550 });
  });

  it("sin pagos, ceros — no null ni NaN", () => {
    expect(repartoTotal([])).toEqual({ cobrado: 0, retenido: 0, recibeOperadora: 0 });
  });

  it("las tres cifras siempre cuadran entre sí", () => {
    const r = repartoTotal([
      { amount_mxn: 13500, platform_fee_mxn: 1800.5 },
      { amount_mxn: 2550, fee_retenido_mxn: 290 },
    ]);
    expect(Math.round((r.retenido + r.recibeOperadora) * 100)).toBe(Math.round(r.cobrado * 100));
  });
});
