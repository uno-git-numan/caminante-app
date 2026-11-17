import { describe, expect, it } from "vitest";
import { enPlazoParaFacturar, fechaDeEmisionGlobal, folioDePago, limiteParaFacturar, periodoAnterior, planGlobal, type PagoParaGlobal } from "@/lib/facturacion/global-plan";

describe("la fecha de emisión de la global (pedido de la contadora)", () => {
  const periodo = { hastaFecha: "2026-11-30" };

  it("el día 1 a las 7:00 de CDMX sale con fecha del último día del mes que factura", () => {
    expect(fechaDeEmisionGlobal(periodo, new Date("2026-12-01T13:00:00Z"))).toBe("2026-12-01T02:00:00.000Z"); // 30 nov, 20:00 CDMX
  });

  it("sigue siendo 30 de noviembre en cualquier huso de México", () => {
    const f = new Date(fechaDeEmisionGlobal(periodo, new Date("2026-12-01T13:00:00Z")) as string);
    for (const tz of ["America/Cancun", "America/Mexico_City", "America/Mazatlan", "America/Tijuana"]) {
      expect(new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(f)).toBe("2026-11-30");
    }
  });

  it("pasadas las 72 horas ya no se puede fechar atrás: sale con la fecha de hoy", () => {
    expect(fechaDeEmisionGlobal(periodo, new Date("2026-12-04T13:00:00Z"))).toBeNull();
  });

  it("nunca una fecha en el futuro", () => {
    expect(fechaDeEmisionGlobal(periodo, new Date("2026-11-30T12:00:00-06:00"))).toBeNull();
  });
});

// La global la arma la plataforma con sus pagos (sin recibos de Facturapi).
const NOV = { desde: "2026-11-01T00:00:00.000-06:00", hasta: "2026-11-30T23:59:59.999-06:00" };
const pago = (x: Partial<PagoParaGlobal>): PagoParaGlobal => ({
  id: "p1",
  folio: 7,
  amount_mxn: 11500,
  refunded_mxn: 0,
  status: "paid",
  status_cfdi: "por-emitir",
  paid_at: "2026-11-15T12:00:00-06:00",
  method: "card",
  ...x,
});

describe("el folio", () => {
  it("es corto y siempre igual para el mismo pago", () => {
    expect(folioDePago(7)).toBe("CAM-000007");
    expect(folioDePago("1234567")).toBe("CAM-1234567");
  });
});

describe("el plazo para facturar por separado", () => {
  it("termina al último instante del mes del cobro, hora de CDMX", () => {
    expect(limiteParaFacturar("2026-11-15T12:00:00-06:00").toISOString()).toBe("2026-12-01T05:59:59.999Z");
  });

  it("un cobro del 30 nov a las 23:30 de CDMX (1 dic en UTC) sigue siendo de noviembre", () => {
    expect(limiteParaFacturar("2026-12-01T05:30:00.000Z").toISOString()).toBe("2026-12-01T05:59:59.999Z");
  });

  it("diciembre cierra en enero", () => {
    expect(limiteParaFacturar("2026-12-20T10:00:00-06:00").toISOString()).toBe("2027-01-01T05:59:59.999Z");
  });

  it("dentro del mes sí; el día 1 siguiente ya no", () => {
    expect(enPlazoParaFacturar("2026-11-15T12:00:00-06:00", new Date("2026-11-30T23:00:00-06:00"))).toBe(true);
    expect(enPlazoParaFacturar("2026-11-15T12:00:00-06:00", new Date("2026-12-01T00:00:01-06:00"))).toBe(false);
    expect(enPlazoParaFacturar(null)).toBe(false);
    expect(enPlazoParaFacturar("no es fecha")).toBe(false);
  });
});

describe("el periodo de la global", () => {
  it("el cron del día 1 a las 13:00 UTC factura el mes anterior completo", () => {
    const p = periodoAnterior(new Date("2026-12-01T13:00:00Z"));
    expect(p.desde).toBe("2026-11-01T00:00:00.000-06:00");
    expect(p.hasta).toBe("2026-11-30T23:59:59.999-06:00");
    expect([p.mes, p.anio]).toEqual(["11", 2026]);
  });

  it("en enero, el mes anterior es diciembre del año pasado", () => {
    const p = periodoAnterior(new Date("2027-01-01T13:00:00Z"));
    expect([p.mes, p.anio, p.desdeFecha, p.hastaFecha]).toEqual(["12", 2026, "2026-12-01", "2026-12-31"]);
  });
});

describe("qué entra a la global", () => {
  it("un concepto por pago, con su folio y por lo cobrado", () => {
    const plan = planGlobal([pago({}), pago({ id: "p2", folio: 8, amount_mxn: 2550 })], NOV);
    expect(plan.renglones).toEqual([
      { paymentId: "p1", folio: "CAM-000007", neto: 11500, devuelto: 0, formaPago: "04" },
      { paymentId: "p2", folio: "CAM-000008", neto: 2550, devuelto: 0, formaPago: "04" },
    ]);
    expect(plan.total).toBe(14050);
    expect(plan.fuera).toEqual([]);
  });

  it("una devolución parcial entra por lo neto, y se anota lo que ya iba descontado", () => {
    const plan = planGlobal([pago({ refunded_mxn: 3500 })], NOV);
    expect(plan.renglones[0]).toMatchObject({ neto: 8000, devuelto: 3500 });
    expect(plan.total).toBe(8000);
  });

  it("queda fuera lo ya facturado, lo de la contadora, lo devuelto completo y lo anterior al corte", () => {
    const plan = planGlobal(
      [
        pago({ id: "a", status_cfdi: "emitido" }),
        pago({ id: "b", status_cfdi: "externo" }),
        pago({ id: "c", status: "refunded", refunded_mxn: 11500 }),
        pago({ id: "d", paid_at: "2026-11-09T12:00:00-06:00" }),
        pago({ id: "e", status_cfdi: "publico-general" }),
      ],
      NOV,
    );
    expect(plan.renglones).toEqual([]);
    expect(plan.fuera.map((f) => f.paymentId)).toEqual(["a", "b", "c", "d", "e"]);
    expect(plan.fuera.find((f) => f.paymentId === "d")?.porque).toMatch(/anterior al corte/);
  });

  it("los pagos de otro mes ni entran ni se reportan", () => {
    const plan = planGlobal([pago({ paid_at: "2026-12-01T00:00:00-06:00" }), pago({ id: "x", paid_at: null })], NOV);
    expect(plan.renglones).toEqual([]);
    expect(plan.fuera).toEqual([]);
  });

  it("el último segundo del mes en CDMX sí es de ese mes", () => {
    expect(planGlobal([pago({ paid_at: "2026-12-01T05:59:59.000Z" })], NOV).renglones).toHaveLength(1);
  });

  it("la forma de pago es la de mayor importe del periodo", () => {
    const plan = planGlobal(
      [pago({ amount_mxn: 2550 }), pago({ id: "t1", method: "transfer", amount_mxn: 16500 }), pago({ id: "c1", method: "cash", amount_mxn: 500 })],
      NOV,
    );
    expect(plan.formaPago).toBe("03");
  });
});
