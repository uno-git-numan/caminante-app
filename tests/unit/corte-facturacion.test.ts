import { describe, expect, it } from "vitest";
import {
  CORTE_FACTURACION_CLIENTES,
  dentroDelCorte,
  inicioDelCorte,
  interruptorClientes,
  UUID_CFDI,
} from "@/lib/facturacion/corte";

describe("el corte de la facturación a clientes", () => {
  it("empieza a las 00:00 de CDMX del día del corte, no a la medianoche UTC", () => {
    // D21: el sistema factura meses completos, desde el 1 de noviembre de 2026.
    expect(CORTE_FACTURACION_CLIENTES).toBe("2026-11-01");
    expect(inicioDelCorte().toISOString()).toBe("2026-11-01T06:00:00.000Z");
  });

  it("un cobro del 31 oct a las 20:00 de CDMX (1 nov en UTC) queda FUERA", () => {
    expect(dentroDelCorte("2026-11-01T02:00:00.000Z")).toBe(false);
  });

  it("un cobro del 1 nov a las 00:00 de CDMX queda dentro", () => {
    expect(dentroDelCorte("2026-11-01T06:00:00.000Z")).toBe(true);
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
