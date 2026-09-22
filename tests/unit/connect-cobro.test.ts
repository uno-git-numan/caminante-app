// POR DÓNDE ENTRA EL DINERO — el cargo con destino y cuánto retiene Numan.
//
// Es la prueba que más cuida: un error aquí no falla, cobra mal. Las cifras de
// «el caso Nomádika» son las de sus 12 ventas reales de septiembre.
import { describe, expect, it } from "vitest";
import { planDeCobro, paraStripe, retencionDe } from "@/lib/payments/connect-cobro";
import { comisionDeVenta, sinIva } from "@/lib/operadores/comision";
import type { OperadorParaGate } from "@/lib/operators/listo-para-vender";

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

  it("una venta de $1,750: Numan retiene $350 y el resto va a la cuenta de la operadora", () => {
    const p = planDeCobro(lista, comision, 1750);
    expect(p.canal).toBe("connect");
    if (p.canal === "connect") {
      expect(p.cuenta).toBe("acct_operadora");
      expect(p.retenidoMxn).toBe(350);
      expect(p.feeCentavos).toBe(35000);
    }
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

  it("el fee nunca pasa de lo cobrado: Stripe rechazaría el cargo", () => {
    // Un caso imposible hoy, pero fallar en la caja con el cliente enfrente es
    // el peor lugar para descubrirlo.
    const p = planDeCobro(lista, 5000, 100);
    if (p.canal === "connect") expect(p.feeCentavos).toBe(10000);
  });

  it("dos boletos: la retención acompaña a la comisión, que es por cabeza", () => {
    const dos = comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 2 } }, { tipo: "escala", escala: "venta" }).monto;
    const p = planDeCobro(lista, dos, 3500);
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

  it("por Connect: on_behalf_of + transfer_data + application_fee", () => {
    expect(paraStripe({ canal: "connect", cuenta: "acct_x", feeCentavos: 35000, retenidoMxn: 350 })).toEqual({
      on_behalf_of: "acct_x",
      transfer_data: { destination: "acct_x" },
      application_fee_amount: 35000,
    });
  });

  it("`on_behalf_of` y el destino son la MISMA cuenta", () => {
    // Si divergieran, el comerciante de registro y quien recibe el dinero serían
    // distintos: el cliente vería un nombre en su estado de cuenta y el dinero
    // llegaría a otro lado. La factura de la operadora dejaría de sostenerse.
    const r = paraStripe({ canal: "connect", cuenta: "acct_y", feeCentavos: 1, retenidoMxn: 0.01 });
    expect(r.on_behalf_of).toBe(r.transfer_data?.destination);
  });
});

describe("la comisión de la escala es una comisión resuelta", () => {
  it("sin porcentaje plano pero con fecha de arranque, la operadora vende", () => {
    // Las 12 ventas de Nomádika tenían commission_pct NULL y retuvieron $301.72
    // cada una. El candado que exigía un plano la habría bloqueado.
    const porEscala = { ...lista, commission_pct: null, comision_desde: "2026-08-28T00:00:00Z" };
    const p = planDeCobro(porEscala, 301.72, 1750);
    expect(p.canal).toBe("connect");
  });

  it("sin plano y sin fecha de arranque no genera comisión: no se vende por Connect", () => {
    const sinNada = { ...lista, commission_pct: null, comision_desde: null };
    expect(planDeCobro(sinNada, 301.72, 1750)).toEqual({ canal: "casa" });
  });
});
