import { describe, expect, it } from "vitest";
import { CLAVE_COMISION, FORMA_PAGO_COMPENSACION, importeEgresoComision, interruptorComisiones, planComision, type PagoConComision } from "@/lib/facturacion/comision-plan";

// B2 · la factura de la comisión de NUMAN a la operadora (D7, D8, D9).
const pago: PagoConComision = { canal_cobro: "connect", status: "paid", amount_mxn: 1750, refunded_mxn: 0, platform_fee_mxn: 350, fee_retenido_mxn: 406 };
const ctx = { servicio: "Izta al amanecer · Nov 28-29", folio: "CAM-000101", admisionMxn: 0 };

describe("el interruptor de comisiones", () => {
  it("sólo `1` lo prende", () => {
    expect(interruptorComisiones({ FACTURACION_COMISIONES: "1" })).toBe(true);
    expect(interruptorComisiones({})).toBe(false);
    expect(interruptorComisiones({ FACTURACION_COMISIONES: "true" })).toBe(false);
  });
});

describe("qué se factura", () => {
  it("la comisión más IVA, que es exactamente lo retenido al cobrar", () => {
    const plan = planComision(pago, ctx);
    expect(plan).toEqual({
      emitir: true,
      conceptos: [{ descripcion: "Comisión de plataforma · Izta al amanecer · Nov 28-29 · operación CAM-000101", cantidad: 1, precioUnitarioConIva: 406, claveProdServ: "80141628" }],
      comisionConIva: 406,
      admisionConIva: 0,
      total: 406,
    });
    expect(CLAVE_COMISION).toBe("80141628");
    expect(FORMA_PAGO_COMPENSACION).toBe("17");
  });

  it("la cuota de admisión va como renglón aparte en la venta que la pagó, sin sumarse a la comisión", () => {
    const plan = planComision(pago, { ...ctx, admisionMxn: 20 });
    if (!plan.emitir) throw new Error("debía emitirse");
    expect(plan.conceptos).toHaveLength(2);
    expect(plan.conceptos[1]).toEqual({ descripcion: "Cuota de admisión a la plataforma, única", cantidad: 1, precioUnitarioConIva: 20, claveProdServ: "80141628" });
    expect([plan.comisionConIva, plan.admisionConIva, plan.total]).toEqual([406, 20, 426]);
  });

  it("sin el dato de lo retenido, se calcula comisión × 1.16", () => {
    const plan = planComision({ ...pago, platform_fee_mxn: 301.72, fee_retenido_mxn: null }, ctx);
    expect(plan.emitir && plan.total).toBe(350);
  });

  it("si lo retenido no es la comisión más IVA, NO se timbra: se revisa", () => {
    const plan = planComision({ ...pago, fee_retenido_mxn: 500 }, ctx);
    expect(plan.emitir).toBe(false);
    expect(!plan.emitir && plan.porque).toMatch(/revisar antes de facturar/);
  });
});

describe("qué NO se factura", () => {
  it("una venta cobrada por la casa: ahí la operadora le factura a NUMAN (D6)", () => {
    expect(planComision({ ...pago, canal_cobro: "casa" }, ctx).emitir).toBe(false);
  });

  it("un pago devuelto completo antes de facturar la comisión", () => {
    expect(planComision({ ...pago, status: "refunded", refunded_mxn: 1750 }, ctx).emitir).toBe(false);
  });

  it("una venta que no generó comisión", () => {
    expect(planComision({ ...pago, platform_fee_mxn: 0, fee_retenido_mxn: 0 }, ctx).emitir).toBe(false);
  });
});

describe("la nota de crédito de la comisión", () => {
  const base = { cobrado: 1750, comisionConIva: 406, admisionConIva: 0, cubierto: 0 };

  it("devolución de la mitad: vuelve la mitad de la comisión", () => {
    expect(importeEgresoComision({ ...base, devuelto: 875 })).toBe(203);
  });

  it("devolución total: vuelve toda la comisión, y la admisión si esa venta la pagó", () => {
    expect(importeEgresoComision({ ...base, devuelto: 1750 })).toBe(406);
    expect(importeEgresoComision({ ...base, admisionConIva: 20, devuelto: 1750 })).toBe(426);
  });

  it("en una devolución parcial la admisión no vuelve", () => {
    expect(importeEgresoComision({ ...base, admisionConIva: 20, devuelto: 875 })).toBe(203);
  });

  it("una segunda devolución ampara sólo lo que falta", () => {
    expect(importeEgresoComision({ ...base, devuelto: 1750, cubierto: 203 })).toBe(203);
  });

  it("lo ya documentado no se repite; sin devolución, nada", () => {
    expect(importeEgresoComision({ ...base, devuelto: 875, cubierto: 203 })).toBe(0);
    expect(importeEgresoComision({ ...base, devuelto: 0 })).toBe(0);
  });
});
