import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CLAVE_EGRESO_CONTRA_GLOBAL, conceptoDeEgreso, netoDePago, planDevolucion, type PagoDevuelto } from "@/lib/facturacion/devolucion-plan";
import { parrafoUnoBis } from "@/lib/facturacion/uno-bis";

// D19 · qué documento toca cada devolución.
const base: PagoDevuelto = {
  amount_mxn: 10000,
  refunded_mxn: 0,
  status_cfdi: "por-emitir",
  paid_at: "2026-11-15T12:00:00-06:00",
  devuelto_al_facturar_mxn: null,
};

describe("la devolución sin CFDI", () => {
  it("sin devolución no hace nada", () => {
    expect(planDevolucion(base).accion).toBe("nada");
  });

  it("total o parcial: no hay documento que corregir; lo que se emita va por lo neto", () => {
    expect(planDevolucion({ ...base, refunded_mxn: 10000 }).accion).toBe("nada");
    expect(planDevolucion({ ...base, refunded_mxn: 3500 }).accion).toBe("nada");
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

  it("un egreso por el mismo acumulado no se repite (webhook + panel)", () => {
    expect(planDevolucion({ ...facturado, refunded_mxn: 2000 }, 2000).accion).toBe("nada");
  });

  it("una segunda devolución ampara sólo la diferencia", () => {
    expect(planDevolucion({ ...facturado, refunded_mxn: 5000 }, 2000)).toEqual({ accion: "egreso", devuelto: 5000, importe: 3000 });
  });

  it("lo que la factura ya salió descontando no lleva egreso", () => {
    // Se devolvieron $2,000, luego se facturó (por $8,000) y después se devolvieron $1,000 más.
    expect(planDevolucion({ ...facturado, refunded_mxn: 3000, devuelto_al_facturar_mxn: 2000 })).toEqual({ accion: "egreso", devuelto: 3000, importe: 1000 });
    expect(planDevolucion({ ...facturado, refunded_mxn: 2000, devuelto_al_facturar_mxn: 2000 }).accion).toBe("nada");
  });
});

describe("lo que no es de la plataforma", () => {
  it("lo que facturó la contadora: su egreso es suyo", () => {
    expect(planDevolucion({ ...base, status_cfdi: "externo", refunded_mxn: 500 }).accion).toBe("contadora");
  });

  it("un cobro anterior al corte no se toca", () => {
    expect(planDevolucion({ ...base, status_cfdi: "emitido", paid_at: "2026-10-31T12:00:00-06:00", refunded_mxn: 10000 }).accion).toBe("nada");
  });
});

// D21 bis · el concepto de la nota de crédito, según contra qué va.
describe("el concepto del egreso", () => {
  const datos = { folio: "CAM-000079", importe: 1500, servicio: "Sardine run · Nov 26-29", claveExperiencia: "90121501" };

  it("contra una global: clave 84111506, el folio de la operación, cantidad 1 y unidad ACT", () => {
    expect(conceptoDeEgreso({ ...datos, contraGlobal: true })).toEqual({
      descripcion: "Devolución · Sardine run · Nov 26-29",
      cantidad: 1,
      precioUnitarioConIva: 1500,
      claveProdServ: "84111506",
      claveUnidad: "ACT",
      noIdentificacion: "CAM-000079",
    });
    expect(CLAVE_EGRESO_CONTRA_GLOBAL).toBe("84111506");
  });

  it("contra la factura a nombre del cliente: la clave de la experiencia, sin folio ni unidad especial", () => {
    expect(conceptoDeEgreso({ ...datos, contraGlobal: false })).toEqual({
      descripcion: "Devolución · Sardine run · Nov 26-29",
      cantidad: 1,
      precioUnitarioConIva: 1500,
      claveProdServ: "90121501",
    });
  });
});

describe("lo neto", () => {
  it("es lo cobrado menos lo devuelto, al centavo", () => {
    expect(netoDePago({ amount_mxn: 11500, refunded_mxn: 2875.5 })).toBe(8624.5);
    expect(netoDePago({ amount_mxn: 11500 })).toBe(11500);
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
