import { describe, expect, it } from "vitest";
import {
  CORTE_FACTURACION_CLIENTES,
  dentroDelCorte,
  inicioDelCorte,
  interruptorClientes,
  recibosQueNoEntranALaGlobal,
  UUID_CFDI,
} from "@/lib/facturacion/corte";

describe("el corte de la facturación a clientes", () => {
  it("empieza a las 00:00 de CDMX del día del corte, no a la medianoche UTC", () => {
    expect(CORTE_FACTURACION_CLIENTES).toBe("2026-11-10");
    expect(inicioDelCorte().toISOString()).toBe("2026-11-10T06:00:00.000Z");
  });

  it("un cobro del 9 nov a las 20:00 de CDMX (10 nov en UTC) queda FUERA", () => {
    expect(dentroDelCorte("2026-11-10T02:00:00.000Z")).toBe(false);
  });

  it("un cobro del 10 nov a las 00:00 de CDMX queda dentro", () => {
    expect(dentroDelCorte("2026-11-10T06:00:00.000Z")).toBe(true);
    expect(dentroDelCorte("2026-11-12T18:30:00-06:00")).toBe(true);
  });

  it("sin fecha de cobro, o con una fecha ilegible, no se factura", () => {
    expect(dentroDelCorte(null)).toBe(false);
    expect(dentroDelCorte(undefined)).toBe(false);
    expect(dentroDelCorte("no es fecha")).toBe(false);
  });
});

describe("el interruptor de clientes", () => {
  it("sólo `1` lo prende", () => {
    expect(interruptorClientes({ FACTURACION_CLIENTES: "1" })).toBe(true);
    expect(interruptorClientes({})).toBe(false);
    expect(interruptorClientes({ FACTURACION_CLIENTES: "true" })).toBe(false);
    expect(interruptorClientes({ FACTURACION_CLIENTES: "0" })).toBe(false);
  });
});

describe("el folio de la contadora", () => {
  it("acepta un UUID de CFDI y rechaza lo demás", () => {
    expect(UUID_CFDI.test("6F1B2C3D-4E5F-4a7b-8c9d-0e1f2a3b4c5d")).toBe(true);
    expect(UUID_CFDI.test("6F1B2C3D4E5F4a7b8c9d0e1f2a3b4c5d")).toBe(false);
    expect(UUID_CFDI.test("")).toBe(false);
  });
});

describe("el candado de la global", () => {
  const bueno = { facturapi_receipt_id: "r1", status: "paid", status_cfdi: "por-emitir", paid_at: "2026-11-15T12:00:00-06:00", refunded_mxn: 0 };

  it("deja pasar los recibos de pagos que sí factura la plataforma", () => {
    expect(recibosQueNoEntranALaGlobal(["r1"], [bueno])).toEqual([]);
  });

  it("detiene la global por cada recibo que no debe entrar, y dice por qué", () => {
    const pagos = [
      bueno,
      { ...bueno, facturapi_receipt_id: "r2", paid_at: "2026-11-09T12:00:00-06:00" },
      { ...bueno, facturapi_receipt_id: "r3", status_cfdi: "externo" },
      { ...bueno, facturapi_receipt_id: "r4", status: "refunded" },
      { ...bueno, facturapi_receipt_id: "r5", refunded_mxn: 1500 },
    ];
    const fuera = recibosQueNoEntranALaGlobal(["r1", "r2", "r3", "r4", "r5", "r6"], pagos);
    expect(fuera.map((f) => f.receiptId)).toEqual(["r2", "r3", "r4", "r5", "r6"]);
    expect(fuera.find((f) => f.receiptId === "r2")?.porque).toMatch(/anterior al corte/);
    expect(fuera.find((f) => f.receiptId === "r3")?.porque).toMatch(/externo/);
    expect(fuera.find((f) => f.receiptId === "r6")?.porque).toMatch(/ningún pago/);
  });
});
