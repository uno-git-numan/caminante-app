// LA RETENCIÓN DE ISR E IVA (lib/fiscal/retencion.ts). Modelo Airbnb, decidido
// por Luis el 11 nov 2026; tasas y base de la decisión D2/D3 de la sesión legal.
import { describe, expect, it } from "vitest";
import { ejercicioDe, retencionDeVenta, retencionVigente } from "@/lib/fiscal/retencion";

const EN_2026 = new Date("2026-11-11T18:00:00Z");

describe("retencionDeVenta", () => {
  it("el ejemplo de legal: $1,750 ⇒ base $1,508.62, IVA $241.38, ISR $37.72, IVA ret. $120.69", () => {
    const r = retencionDeVenta(1750, { conRfc: true, fecha: EN_2026 });
    expect(r).toMatchObject({ base: 1508.62, ivaCobrado: 241.38, isr: 37.72, iva: 120.69, total: 158.41, ejercicio: 2026 });
    expect(r?.regla).toBe("2026:isr=0.025;iva=0.5;rfc");
  });
  it("base + IVA = lo cobrado, al centavo", () => {
    for (const c of [1750, 3500, 999.99, 12345.67, 0.5]) {
      const r = retencionDeVenta(c, { conRfc: true, fecha: EN_2026 })!;
      expect(Math.round((r.base + r.ivaCobrado) * 100)).toBe(Math.round(c * 100));
    }
  });
  it("sin RFC: 20 % de ISR y 100 % del IVA", () => {
    const r = retencionDeVenta(1750, { conRfc: false, fecha: EN_2026 })!;
    expect(r.isr).toBe(301.72);
    expect(r.iva).toBe(241.38);
    expect(r.regla).toContain("sin_rfc");
  });
  it("un ejercicio sin tasas ⇒ null (no se cobra por cuenta conectada)", () => {
    expect(retencionDeVenta(1750, { conRfc: true, fecha: new Date("2031-01-15T18:00:00Z") })).toBeNull();
  });
  it("nada cobrado ⇒ null", () => {
    expect(retencionDeVenta(0, { conRfc: true, fecha: EN_2026 })).toBeNull();
  });
});

describe("ejercicioDe", () => {
  it("se cuenta en hora de la Ciudad de México: el 1 ene 05:00 UTC todavía es 2025", () => {
    expect(ejercicioDe(new Date("2026-01-01T05:00:00Z"))).toBe(2025);
    expect(ejercicioDe(new Date("2026-01-01T07:00:00Z"))).toBe(2026);
  });
});

describe("retencionVigente — lo que sigue en pie tras devoluciones", () => {
  const pago = { amount_mxn: 1750, isr_retenido_mxn: 37.72, iva_retenido_mxn: 120.69 };
  it("sin devolución, todo", () => {
    expect(retencionVigente(pago, 0)).toEqual({ isr: 37.72, iva: 120.69 });
  });
  it("devuelta la mitad, la mitad", () => {
    expect(retencionVigente(pago, 875)).toEqual({ isr: 18.86, iva: 60.35 });
  });
  it("devuelta completa, nada (D9)", () => {
    expect(retencionVigente(pago, 1750)).toEqual({ isr: 0, iva: 0 });
  });
  it("una venta sin retención, cero", () => {
    expect(retencionVigente({ amount_mxn: 1750 }, 0)).toEqual({ isr: 0, iva: 0 });
  });
});
