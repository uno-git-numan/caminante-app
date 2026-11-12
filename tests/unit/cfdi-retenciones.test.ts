// EL CFDI DE RETENCIONES (lib/fiscal/cfdi-retenciones.ts): montos con la regla
// del SAT, el XML del complemento validado contra el XSD oficial y el cuerpo
// para Facturapi. Reglas: design/legal/REPORTE-MENSUAL-RETENCIONES-2026-11-12.md.
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  CATALOGO, catalogoListo, formaPagoServ, medioDeStripe, montosSegunSat, payloadRetencion, xmlComplemento, type Catalogo,
} from "@/lib/fiscal/cfdi-retenciones";

// Claves que EXISTEN en los XSD, sólo para probar la forma. Las reales las
// confirma la sesión legal (CATALOGO).
const DE_PRUEBA: Catalogo = { tipoDeServ: "06", periodicidadMensual: "04", impuestoIva: "02", tipoPagoRetIsr: "03", tipoPagoRetIva: "01", formaPagoPrepago: "04", fuente: "prueba" };
const ventas = [
  { paymentId: "p1", fecha: "2026-11-05", base: 1508.62, comision: 301.72, medio: "card:credit" },
  { paymentId: "p2", fecha: "2026-11-20", base: 754.31, comision: 150.86, medio: "card:debit" },
];

describe("catálogo confirmado por legal (12 nov 2026)", () => {
  it("las 6 claves están y son las del XLS oficial", () => {
    expect(catalogoListo(CATALOGO)).toEqual({ ok: true });
    expect(CATALOGO).toMatchObject({ tipoDeServ: "06", periodicidadMensual: "02", impuestoIva: "02", tipoPagoRetIsr: "04", tipoPagoRetIva: "01", formaPagoPrepago: "06" });
  });
  it("si una clave vuelve a null, no se emite y dice cuál", () => {
    expect(catalogoListo({ ...CATALOGO, tipoDeServ: null })).toEqual({ ok: false, faltan: ["tipoDeServ"] });
  });
  it("una tarjeta prepago se reporta como débito (M16)", () => {
    expect(formaPagoServ("card:prepaid")).toBe("06");
  });
});

describe("forma de pago (M14)", () => {
  it("de Stripe al medio guardado y a la clave del complemento", () => {
    expect(medioDeStripe({ type: "card", card: { funding: "credit" } })).toBe("card:credit");
    expect(medioDeStripe({ type: "oxxo" })).toBe("oxxo");
    expect(formaPagoServ("card:credit", DE_PRUEBA)).toBe("03");
    expect(formaPagoServ("card:debit", DE_PRUEBA)).toBe("06");
    expect(formaPagoServ("oxxo", DE_PRUEBA)).toBe("01");
  });
  it("sin dato no se adivina", () => {
    expect(formaPagoServ(null, DE_PRUEBA)).toBeNull();
    expect(formaPagoServ("card:unknown", DE_PRUEBA)).toBeNull();
  });
});

describe("montosSegunSat", () => {
  it("base del mes × tasa, TRUNCADO (regla del SAT, M15)", () => {
    const m = montosSegunSat(ventas, { isr: 0.025, iva: 0.5 });
    // 2,262.93 × 2.5 % = 56.57325 → 56.57; IVA: 241.38 + 120.69 = 362.07 × 50 % = 181.035 → 181.03
    expect(m).toEqual({ numServ: 2, montoOperacion: 2262.93, ivaTrasladado: 362.07, isr: 56.57, iva: 181.03, difIva: 181.04, comision: 452.58 });
  });
});

describe("xmlComplemento", () => {
  it("una venta sin forma de pago conocida detiene la emisión", () => {
    const r = xmlComplemento([{ ...ventas[0], medio: null }], { isr: 0.025, iva: 0.5 }, DE_PRUEBA);
    expect(r.ok).toBe(false);
  });
  it("el porcentaje de la comisión va como fracción (20 % ⇒ 0.200)", () => {
    const r = xmlComplemento(ventas, { isr: 0.025, iva: 0.5 }, CATALOGO);
    if (!r.ok) throw new Error(r.porque);
    expect(r.xml).toContain('Porcentaje="0.200"');
    expect(r.xml).toContain('Periodicidad="02"');
    expect(r.xml).toContain('TipoDeServ="06"');
    expect(r.xml).toContain('NumServ="2"');
  });

  let hayXmllint = true;
  try {
    execFileSync("xmllint", ["--version"], { stdio: "ignore" });
  } catch {
    hayXmllint = false;
  }
  it.skipIf(!hayXmllint)("VALIDA contra el XSD oficial del SAT, con el catálogo confirmado", () => {
    const r = xmlComplemento(ventas, { isr: 0.025, iva: 0.5 }, CATALOGO);
    if (!r.ok) throw new Error(r.porque);
    const dir = mkdtempSync(join(tmpdir(), "spt-"));
    const f = join(dir, "c.xml");
    writeFileSync(f, '<?xml version="1.0" encoding="UTF-8"?>' + r.xml);
    const xsd = resolve(__dirname, "../fixtures/sat/ServiciosPlataformasTecnologicas10.xsd");
    expect(() => execFileSync("xmllint", ["--noout", "--schema", xsd, f], { stdio: "pipe" })).not.toThrow();
  });
});

describe("payloadRetencion", () => {
  it("clave 26, un mes, totales y los dos impuestos con su tipo de pago", () => {
    const r = xmlComplemento(ventas, { isr: 0.025, iva: 0.5 }, CATALOGO);
    if (!r.ok) throw new Error(r.porque);
    const p = payloadRetencion("2026-11", { rfc: "ROBL990531HI3", razonSocial: "LAURA CATALINA ROMERO BARRAGAN", regimen: "626", cp: "76230", email: "a@b.mx" }, r, CATALOGO, "ret-2026-11-op");
    expect(p).toMatchObject({
      cve_retenc: "26",
      periodo: { mes_ini: 11, mes_fin: 11, ejerc: 2026 },
      totales: { monto_tot_operacion: 2262.93, monto_tot_exent: 0 },
      complements: [r.xml],
      idempotency_key: "ret-2026-11-op",
    });
    // Facturapi rechaza monto_tot_grav y monto_tot_ret (los deriva): sandbox, 11 nov 2026.
    expect(p.totales).not.toHaveProperty("monto_tot_grav");
    expect(p.totales).not.toHaveProperty("monto_tot_ret");
    expect(p.totales.imp_retenidos).toEqual([
      // 04 «Pago provisional ISR» por omisión (LISR 113-A 3º).
      { impuesto: "ISR", base_ret: 2262.93, monto_ret: 56.57, tipo_pago_ret: "04" },
      { impuesto: "IVA", base_ret: 362.07, monto_ret: 181.03, tipo_pago_ret: "01" },
    ]);
  });
});
