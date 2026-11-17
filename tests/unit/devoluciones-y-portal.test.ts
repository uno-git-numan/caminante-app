import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { netoDePago, planDevolucion, type PagoDevuelto } from "@/lib/facturacion/devolucion-plan";
import { recibosQueNoEntranALaGlobal } from "@/lib/facturacion/corte";
import { parrafoUnoBis } from "@/lib/facturacion/uno-bis";

// D19 · qué documento toca cada devolución.
const base: PagoDevuelto = {
  amount_mxn: 10000,
  refunded_mxn: 0,
  status_cfdi: "por-emitir",
  paid_at: "2026-11-15T12:00:00-06:00",
  facturapi_receipt_id: "rec_1",
  recibo_neto_de_mxn: null,
};

describe("la devolución sin CFDI: el recibo", () => {
  it("sin devolución no hace nada", () => {
    expect(planDevolucion(base).accion).toBe("nada");
  });

  it("total: se cancela el recibo", () => {
    expect(planDevolucion({ ...base, refunded_mxn: 10000 })).toEqual({ accion: "cancelar-recibo", devuelto: 10000 });
  });

  it("parcial: se reexpide por lo neto", () => {
    expect(planDevolucion({ ...base, refunded_mxn: 3500 })).toEqual({ accion: "reexpedir-recibo", devuelto: 3500, neto: 6500 });
  });

  it("un recibo ya reexpedido por ese monto no se vuelve a tocar (webhook + panel)", () => {
    expect(planDevolucion({ ...base, refunded_mxn: 3500, recibo_neto_de_mxn: 3500 }).accion).toBe("nada");
  });

  it("una segunda devolución sobre un recibo ya ajustado lo vuelve a reexpedir", () => {
    expect(planDevolucion({ ...base, refunded_mxn: 5000, recibo_neto_de_mxn: 3500 })).toEqual({ accion: "reexpedir-recibo", devuelto: 5000, neto: 5000 });
  });

  it("sin recibo todavía no hay nada que cancelar: lo que salga después ya va por lo neto", () => {
    expect(planDevolucion({ ...base, facturapi_receipt_id: null, refunded_mxn: 3500 }).accion).toBe("nada");
  });
});

describe("la devolución con CFDI: el egreso", () => {
  const facturado: PagoDevuelto = { ...base, status_cfdi: "emitido" };

  it("factura del cliente: egreso por lo devuelto", () => {
    expect(planDevolucion({ ...facturado, refunded_mxn: 2000 })).toEqual({ accion: "egreso", devuelto: 2000, importe: 2000 });
  });

  it("en la global: también egreso (lo relaciona con la global)", () => {
    expect(planDevolucion({ ...facturado, status_cfdi: "publico-general", refunded_mxn: 10000 }).accion).toBe("egreso");
  });

  it("un egreso por el mismo acumulado no se repite", () => {
    expect(planDevolucion({ ...facturado, refunded_mxn: 2000 }, 2000).accion).toBe("nada");
  });

  it("una segunda devolución ampara sólo la diferencia", () => {
    expect(planDevolucion({ ...facturado, refunded_mxn: 5000 }, 2000)).toEqual({ accion: "egreso", devuelto: 5000, importe: 3000 });
  });

  it("lo que la factura ya salió descontando no lleva egreso", () => {
    // Se devolvieron $2,000, luego el cliente facturó (por $8,000) y después se devolvieron $1,000 más.
    expect(planDevolucion({ ...facturado, refunded_mxn: 3000, recibo_neto_de_mxn: 2000 })).toEqual({ accion: "egreso", devuelto: 3000, importe: 1000 });
    expect(planDevolucion({ ...facturado, refunded_mxn: 2000, recibo_neto_de_mxn: 2000 }).accion).toBe("nada");
  });
});

describe("lo que no es de la plataforma", () => {
  it("lo que facturó la contadora: su egreso es suyo", () => {
    expect(planDevolucion({ ...base, status_cfdi: "externo", facturapi_receipt_id: null, refunded_mxn: 500 }).accion).toBe("contadora");
  });

  it("un cobro anterior al corte no se toca", () => {
    expect(planDevolucion({ ...base, paid_at: "2026-11-09T12:00:00-06:00", refunded_mxn: 10000 }).accion).toBe("nada");
  });
});

describe("lo neto", () => {
  it("es lo cobrado menos lo devuelto, al centavo", () => {
    expect(netoDePago({ amount_mxn: 11500, refunded_mxn: 2875.5 })).toBe(8624.5);
    expect(netoDePago({ amount_mxn: 11500 })).toBe(11500);
  });
});

describe("la global con un recibo reexpedido", () => {
  const pago = { facturapi_receipt_id: "r1", status: "paid", status_cfdi: "por-emitir", paid_at: "2026-11-15T12:00:00-06:00" };

  it("entra si el recibo ya descuenta lo devuelto", () => {
    expect(recibosQueNoEntranALaGlobal(["r1"], [{ ...pago, refunded_mxn: 3500, recibo_neto_de_mxn: 3500 }])).toEqual([]);
  });

  it("se detiene si hay devolución que el recibo no descuenta", () => {
    expect(recibosQueNoEntranALaGlobal(["r1"], [{ ...pago, refunded_mxn: 5000, recibo_neto_de_mxn: 3500 }])).toHaveLength(1);
  });
});

// D20 · lo que la operadora acepta al activar es el §1 bis del convenio PUBLICADO.
describe("el consentimiento de la facturación desde el portal", () => {
  const firmable = readFileSync("design/operadores/CONVENIO-v3-FIRMABLE.md", "utf8");

  it("el firmable publicado (v3.3, hash 32d3701e…) es el que está en el repo", () => {
    expect(createHash("sha256").update(firmable, "utf8").digest("hex")).toBe("32d3701eff720e8e0e24972f2834e034fb997c3da18a4c958f7ed2ac8383e978");
  });

  it("se recorta el párrafo 1 bis completo, con sus cuatro condiciones y la aceptación", () => {
    const t = parrafoUnoBis(firmable);
    expect(t).not.toBeNull();
    expect(t!.startsWith("**1 bis · Condiciones de la facturación desde el portal.**")).toBe(true);
    for (const pieza of ["(i) firma", "(ii) carga", "(iii) reconoce", "(iv) acepta", "da de baja el certificado", "constituye la aceptación de este punto"]) {
      expect(t).toContain(pieza);
    }
  });

  it("una versión sin el punto no ofrece nada que aceptar", () => {
    expect(parrafoUnoBis("# Convenio\n\n**1 · De la facturación.** …")).toBeNull();
  });
});
