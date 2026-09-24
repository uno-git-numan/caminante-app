// EL GATE DE CONNECT — «operador listo para vender». Hoy nadie lo llama en la
// caja (ver design/mvp/MVP.md §5.2); estas pruebas fijan lo que promete para
// cuando se cablee a las tres puertas.
import { describe, expect, it } from "vitest";
import {
  COLUMNAS_GATE,
  csdVigente,
  diasParaVencerCsd,
  operadorListo,
  requiereConnect,
  type OperadorParaGate,
} from "@/lib/operators/listo-para-vender";

const HOY = new Date(2026, 8, 22, 12, 0, 0); // 22 sep 2026, mediodía

const completo: OperadorParaGate = {
  stripe_account_id: "acct_123",
  stripe_charges_enabled: true,
  csd_cer_path: "csd/a.cer",
  csd_key_path: "csd/a.key",
  csd_vence_at: "2029-05-12",
  rfc: "ROBL990531HI3",
  razon_social: "Nomádika",
  regimen_fiscal: "612",
  cp_fiscal: "06700",
  tipo_persona: "fisica",
  convenio_firmado_at: "2026-09-01T00:00:00Z",
  commission_pct: 20,
};

describe("requiereConnect", () => {
  it("sólo quien tiene cuenta conectada entra al camino nuevo", () => {
    expect(requiereConnect({ stripe_account_id: "acct_1" })).toBe(true);
    expect(requiereConnect({ stripe_account_id: "   " })).toBe(false);
    expect(requiereConnect({ stripe_account_id: null })).toBe(false);
    expect(requiereConnect(null)).toBe(false);
  });
});

describe("csdVigente / diasParaVencerCsd", () => {
  it("compara por día: vence al final de su día", () => {
    expect(csdVigente("2026-09-22", HOY)).toBe(true);
    expect(csdVigente("2026-09-21", HOY)).toBe(false);
    expect(diasParaVencerCsd("2026-09-22", HOY)).toBe(1);
    // Venció anoche: ceil(-0.5) = -0. Es cero; Object.is lo distingue y a nadie le sirve.
    expect(diasParaVencerCsd("2026-09-21", HOY)).toBeCloseTo(0);
    expect(diasParaVencerCsd("2026-09-01", HOY)).toBeLessThan(0);
  });

  it("sin fecha no es vigente: la ausencia no cuenta como «para siempre»", () => {
    expect(csdVigente(null, HOY)).toBe(false);
    expect(csdVigente("", HOY)).toBe(false);
    expect(csdVigente("no-es-fecha", HOY)).toBe(false);
    expect(diasParaVencerCsd(undefined, HOY)).toBeNull();
  });
});

describe("operadorListo", () => {
  it("sin Connect no aplica: la casa vende como siempre", () => {
    expect(operadorListo({ stripe_account_id: null }, HOY)).toEqual({ ok: true, faltantes: [] });
    expect(operadorListo(null, HOY).ok).toBe(true);
  });

  it("con todo en orden, pasa", () => {
    expect(operadorListo(completo, HOY)).toEqual({ ok: true, faltantes: [] });
  });

  it("commission_pct en NULL NO bloquea si hay fecha de arranque: cobra la escala", () => {
    // Corregido el 22 sep 2026. El candado exigía un porcentaje PLANO y eso era
    // falso desde que existe la escala: las 12 ventas de Nomádika tenían
    // `commission_pct` NULL y retuvieron $301.72 cada una, no cero. Bloquear ahí
    // habría detenido a toda operadora sin trato negociado — el caso normal.
    const porEscala = { ...completo, commission_pct: null, comision_desde: "2026-08-28T00:00:00Z" };
    expect(operadorListo(porEscala, HOY)).toEqual({ ok: true, faltantes: [] });
  });

  it("sin porcentaje Y sin fecha de arranque sí bloquea: ahí el fee sería cero de verdad", () => {
    const r = operadorListo({ ...completo, commission_pct: null, comision_desde: null }, HOY);
    expect(r.ok).toBe(false);
    expect(r.faltantes.join(" ")).toMatch(/no genera comisión/i);
  });

  it("exige los DOS archivos del CSD, y los nombra", () => {
    const r = operadorListo({ ...completo, csd_key_path: null }, HOY);
    expect(r.faltantes.join(" ")).toMatch(/\.key/);
    expect(r.faltantes.join(" ")).not.toMatch(/\.cer/);
  });

  it("un CSD vencido dice hace cuántos días", () => {
    const r = operadorListo({ ...completo, csd_vence_at: "2026-09-01" }, HOY);
    expect(r.faltantes.join(" ")).toMatch(/venció hace 20 día/);
  });

  it("lo que Stripe dice manda sobre lo que nosotros creemos", () => {
    const r = operadorListo({ ...completo, stripe_charges_enabled: false }, HOY);
    expect(r.faltantes[0]).toMatch(/cuenta de cobro todavía no está verificada/);
  });

  it("con todo vacío enumera las seis faltas, una por condición", () => {
    const r = operadorListo({ stripe_account_id: "acct_x" }, HOY);
    expect(r.ok).toBe(false);
    expect(r.faltantes).toHaveLength(6);
  });

  it("el select del gate pide TODAS las columnas que el gate lee", () => {
    // Un campo ausente llega como `undefined` y el gate lo reporta faltante
    // aunque en la base esté lleno. `comision_desde` entró al gate el 22 sep y
    // por poco se queda fuera de COLUMNAS_GATE.
    for (const c of ["commission_pct", "comision_desde", "convenio_firmado_at", "csd_key_path", "tipo_persona"]) {
      expect(COLUMNAS_GATE).toContain(c);
    }
  });
});
