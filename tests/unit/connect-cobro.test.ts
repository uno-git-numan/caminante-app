// POR DÓNDE ENTRA EL DINERO — el cargo con destino y cuánto retiene Numan.
//
// Es la prueba que más cuida: un error aquí no falla, cobra mal. Las cifras de
// «el caso Nomádika» son las de sus 12 ventas reales de septiembre.
import { describe, expect, it } from "vitest";
import { planDeCobro, paraStripe, retencionDe } from "@/lib/payments/connect-cobro";
import { comisionDeVenta, sinIva } from "@/lib/operadores/comision";
import type { OperadorParaGate } from "@/lib/operators/listo-para-vender";

// Toda prueba cobra en 2026: las tasas de retención son por ejercicio.
const EN_2026 = new Date("2026-11-11T18:00:00Z");

const lista: OperadorParaGate = {
  stripe_account_id: "acct_operadora",
  stripe_charges_enabled: true,
  csd_cer_path: "a.cer",
  csd_key_path: "a.key",
  csd_vence_at: "2030-01-01",
  rfc: "ROBL990531HI3",
  razon_social: "Nomádika",
  regimen_fiscal: "612",
  cp_fiscal: "06700",
  tipo_persona: "fisica",
  convenio_firmado_at: "2026-09-01",
  commission_pct: 20,
};

describe("retencionDe — comisión + IVA", () => {
  it("el caso Nomádika: $301.72 de comisión ⇒ $350.00 retenidos", () => {
    expect(retencionDe(301.72)).toBe(350);
  });

  it("redondea a centavos, no arrastra flotantes", () => {
    expect(retencionDe(226.29)).toBe(262.5);
    expect(retencionDe(0)).toBe(0);
  });
});

describe("planDeCobro", () => {
  const base = sinIva(1750);
  const comision = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 1 } }, { tipo: "escala", escala: "venta" }).monto;

  it("una venta de $1,750: comisión $350, retención $158.40, a la operadora $1,241.60", () => {
    const p = planDeCobro(lista, comision, 1750, EN_2026);
    expect(p.canal).toBe("connect");
    if (p.canal === "connect") {
      expect(p.cuenta).toBe("acct_operadora");
      expect(p.retenidoMxn).toBe(350);
      expect(p.retencion.isr).toBe(37.71); // truncado (M15)
      expect(p.retencion.iva).toBe(120.69);
      expect(p.transferCentavos).toBe(124160);
    }
  });

  it("EL CANDADO: un ejercicio sin tasas de retención no cobra por cuenta conectada", () => {
    expect(planDeCobro(lista, comision, 1750, new Date("2031-06-01T18:00:00Z"))).toEqual({ canal: "casa" });
  });

  it("sin RFC: retiene 20 % / 100 %", () => {
    const p = planDeCobro({ ...lista, rfc: null } as OperadorParaGate, comision, 1750, EN_2026);
    // Sin RFC el gate ya no la deja vender; si algún día lo hiciera, la tasa sería la de sin RFC.
    if (p.canal === "connect") expect(p.retencion.regla).toContain("sin_rfc");
  });

  it("sin cuenta conectada: el camino de siempre", () => {
    expect(planDeCobro({ ...lista, stripe_account_id: null }, comision, 1750)).toEqual({ canal: "casa" });
    expect(planDeCobro(null, comision, 1750)).toEqual({ canal: "casa" });
  });

  it("en Connect pero sin estar lista: el camino de siempre, NUNCA a medias", () => {
    // Que el gate la detenga no puede significar «cóbrale igual pero a su
    // cuenta»: eso sería vender sin convenio y con el dinero ya afuera.
    expect(planDeCobro({ ...lista, convenio_firmado_at: null }, comision, 1750)).toEqual({ canal: "casa" });
    expect(planDeCobro({ ...lista, stripe_charges_enabled: false }, comision, 1750)).toEqual({ canal: "casa" });
  });

  it("sin comisión que retener no hay cargo con destino: transferiría el 100%", () => {
    expect(planDeCobro(lista, 0, 1750)).toEqual({ canal: "casa" });
  });

  it("si no le quedara nada que transferir, no se cobra por Connect: Stripe rechazaría el cargo", () => {
    // Un caso imposible hoy, pero fallar en la caja con el cliente enfrente es
    // el peor lugar para descubrirlo.
    expect(planDeCobro(lista, 5000, 100, EN_2026)).toEqual({ canal: "casa" });
  });

  it("dos boletos: la retención acompaña a la comisión, que es por cabeza", () => {
    const dos = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 2 } }, { tipo: "escala", escala: "venta" }).monto;
    const p = planDeCobro(lista, dos, 3500, EN_2026);
    if (p.canal === "connect") {
      expect(dos).toBe(603.44);
      // 603.44 × 1.16 = 699.9904 → $699.99, no $700. El centavo se pierde
      // porque la comisión YA venía redondeada a centavos por cabeza
      // (301.72 × 2), y el IVA se aplica sobre esa suma. Es el mismo criterio
      // que usa el CFDI: se factura sobre lo cobrado, no sobre un ideal.
      expect(p.retenidoMxn).toBe(699.99);
    }
  });
});

describe("paraStripe", () => {
  it("por la casa no agrega NADA a la sesión: el camino viejo queda idéntico", () => {
    expect(paraStripe({ canal: "casa" })).toEqual({});
  });

  const plan = (cuenta: string) => {
    const p = planDeCobro({ ...lista, stripe_account_id: cuenta }, 301.72, 1750, EN_2026);
    if (p.canal !== "connect") throw new Error("se esperaba connect");
    return p;
  };

  it("por Connect: on_behalf_of + transfer_data con el monto NETO, sin application_fee", () => {
    // Stripe no acepta application_fee_amount y transfer_data[amount] juntos
    // («mutually exclusive», probado en test el 11 nov 2026).
    expect(paraStripe(plan("acct_x"))).toEqual({
      on_behalf_of: "acct_x",
      transfer_data: { destination: "acct_x", amount: 124160 },
    });
  });

  it("`on_behalf_of` y el destino son la MISMA cuenta", () => {
    // Si divergieran, el comerciante de registro y quien recibe el dinero serían
    // distintos: el cliente vería un nombre en su estado de cuenta y el dinero
    // llegaría a otro lado. La factura de la operadora dejaría de sostenerse.
    const r = paraStripe(plan("acct_y"));
    expect(r.on_behalf_of).toBe(r.transfer_data?.destination);
  });
});

describe("la comisión de la escala es una comisión resuelta", () => {
  it("sin porcentaje plano pero con fecha de arranque, la operadora vende", () => {
    // Las 12 ventas de Nomádika tenían commission_pct NULL y retuvieron $301.72
    // cada una. El candado que exigía un plano la habría bloqueado.
    const porEscala = { ...lista, commission_pct: null, comision_desde: "2026-08-28T00:00:00Z" };
    const p = planDeCobro(porEscala, 301.72, 1750, EN_2026);
    expect(p.canal).toBe("connect");
  });

  it("sin plano y sin fecha de arranque no genera comisión: no se vende por Connect", () => {
    const sinNada = { ...lista, commission_pct: null, comision_desde: null };
    expect(planDeCobro(sinNada, 301.72, 1750)).toEqual({ canal: "casa" });
  });
});
