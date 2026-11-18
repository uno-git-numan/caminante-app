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

// D22 · quién le factura al cliente lo decide el convenio, no el canal.
import { facturaLaCasa } from "@/lib/facturacion/quien-factura";
import { puedeCobrarsePorLaCasa } from "@/lib/operators/listo-para-vender";

describe("quién le factura al cliente (D22)", () => {
  it("la casa factura lo suyo y lo que no tiene operadora", () => {
    expect(facturaLaCasa(null)).toBe(true);
    expect(facturaLaCasa({ es_la_casa: true, convenio_firmado_at: null })).toBe(true);
  });

  it("una operadora SIN convenio vende con dispensa: NUMAN vende a nombre propio y factura NUMAN", () => {
    expect(facturaLaCasa({ es_la_casa: false, convenio_firmado_at: null })).toBe(true);
  });

  it("una operadora CON convenio firmado es quien vende: factura ella", () => {
    expect(facturaLaCasa({ es_la_casa: false, convenio_firmado_at: "2026-11-20T10:00:00Z" })).toBe(false);
  });
});

describe("el candado de D22: con convenio firmado no se cobra en la cuenta de la casa", () => {
  it("sin convenio, la casa cobra como siempre", () => {
    expect(puedeCobrarsePorLaCasa(null)).toBe(true);
    expect(puedeCobrarsePorLaCasa({ convenio_firmado_at: null })).toBe(true);
  });

  it("con convenio firmado, no: habría que retener y facturar comisión, y eso sólo existe por cuenta conectada", () => {
    expect(puedeCobrarsePorLaCasa({ convenio_firmado_at: "2026-11-20T10:00:00Z" })).toBe(false);
  });
});

import { fechaDeComision } from "@/lib/facturacion/comision-plan";

describe("la fecha de la factura de comisión (D24)", () => {
  it("cobro y emisión en el mismo mes: sale con la fecha de hoy", () => {
    expect(fechaDeComision("2026-11-17T20:00:00-06:00", new Date("2026-11-17T21:00:00-06:00"))).toBeNull();
  });

  it("cobro el último día por la noche, emisión ya en el mes siguiente: se fecha el día del cobro", () => {
    expect(fechaDeComision("2026-11-30T23:40:00-06:00", new Date("2026-12-01T00:10:00-06:00"))).toBe("2026-12-01T05:40:00.000Z");
  });

  it("el mes es el de CDMX, no el de UTC", () => {
    // 30 nov 20:00 CDMX ya es 1 dic en UTC, pero el cobro y la emisión son del mismo mes de CDMX.
    expect(fechaDeComision("2026-11-30T19:00:00-06:00", new Date("2026-11-30T20:00:00-06:00"))).toBeNull();
  });

  it("pasadas 71 horas ya no se puede fechar atrás", () => {
    expect(fechaDeComision("2026-11-30T23:40:00-06:00", new Date("2026-12-04T09:00:00-06:00"))).toBeNull();
  });

  it("sin fecha de cobro no se supone ninguna", () => {
    expect(fechaDeComision(null)).toBeNull();
  });
});
