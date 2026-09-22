// LOS CANDADOS DE VENTA — una puerta para las tres puertas.
//
// Se simulan los dos candados con dueño propio (`actividadListaParaPublicar`
// y la lectura de `operators`) y se prueba lo que ESTA función decide: el
// orden, el primer cerrado, el momento (publicar exige encuesta; vender no),
// y que ante un error de lectura muerde.
import { beforeEach, describe, expect, it, vi } from "vitest";

const sim = vi.hoisted(() => ({
  actividad: { ok: true } as Record<string, unknown>,
  operadora: null as null | Record<string, unknown>,
  errorOperadora: false,
}));

vi.mock("@/lib/operadores/candado-actividad", () => ({
  actividadListaParaPublicar: async () => sim.actividad,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.maybeSingle = async () =>
        sim.errorOperadora ? { data: null, error: { message: "boom" } } : { data: sim.operadora, error: null };
      return q;
    },
  }),
}));

import { candadosDe } from "@/lib/experiences/candados-venta";
import type { Experience } from "@/lib/experiences/types";

const completa = {
  registration: { active: true, waiverVersion: "v1", waiverDocUrl: "", waiverClauses: ["Acepto."] },
  feedback: { active: true, version: "v1", locationLabel: "Bosque", npsEnabled: true, sections: [{ key: "g", label: "Guía" }] },
} as unknown as Experience;

const sinEncuesta = { ...completa, feedback: { ...completa.feedback!, active: false } } as Experience;

const conectadaLista = {
  stripe_account_id: "acct_1",
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

beforeEach(() => {
  sim.actividad = { ok: true };
  sim.operadora = null;
  sim.errorOperadora = false;
});

describe("candadosDe", () => {
  it("la casa con todo prendido: publica y vende", async () => {
    sim.operadora = { stripe_account_id: null };
    expect(await candadosDe("publicar", { data: completa, operator_id: "casa", actividad: null })).toEqual({ ok: true });
    expect(await candadosDe("vender", { data: completa, operator_id: "casa", actividad: null })).toEqual({ ok: true });
  });

  it("PUBLICAR exige la encuesta; VENDER no (una venta con encuesta apagada no daña al cliente)", async () => {
    sim.operadora = { stripe_account_id: null };
    const pub = await candadosDe("publicar", { data: sinEncuesta, operator_id: "casa", actividad: null });
    expect(pub.ok).toBe(false);
    if (!pub.ok) expect(pub.motivo).toBe("flujo");
    expect((await candadosDe("vender", { data: sinEncuesta, operator_id: "casa", actividad: null })).ok).toBe(true);
  });

  it("sin deslinde no se vende, y se dice qué falta", async () => {
    const r = await candadosDe("vender", { data: {} as Experience, operator_id: null, actividad: null });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("flujo");
      expect(r.faltantes.length).toBeGreaterThan(0);
    }
  });

  it("el expediente de la actividad cierra la puerta y viaja completo", async () => {
    sim.actividad = { ok: false, motivo: "no_aprobada", actividad: "senderismo", nombre: "Senderismo y caminata", estado: "incompleta", documentos: 3, mensaje: "Falta el expediente." };
    const r = await candadosDe("vender", { data: completa, operator_id: "op", actividad: "senderismo" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("actividad");
      expect(r.candado?.motivo).toBe("no_aprobada");
      expect(r.mensaje).toBe("Falta el expediente.");
    }
  });

  it("una dispensa vigente abre la puerta y se conserva en el veredicto", async () => {
    sim.actividad = { ok: true, dispensa: { motivo: "En trámite", autorizadaPor: "uno@numanhub.com", venceAt: "2099-01-01" } };
    sim.operadora = { stripe_account_id: null };
    const r = await candadosDe("vender", { data: completa, operator_id: "op", actividad: "senderismo" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dispensa?.motivo).toBe("En trámite");
  });

  it("operadora en Connect y lista: vende; en Connect y a medias: no, con sus faltas", async () => {
    sim.operadora = conectadaLista;
    expect((await candadosDe("vender", { data: completa, operator_id: "op", actividad: "senderismo" })).ok).toBe(true);
    sim.operadora = { ...conectadaLista, commission_pct: null, csd_key_path: null };
    const r = await candadosDe("vender", { data: completa, operator_id: "op", actividad: "senderismo" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("operadora");
      expect(r.faltantes).toHaveLength(2);
    }
  });

  it("operadora sin cuenta conectada: vende por el camino de siempre", async () => {
    sim.operadora = { stripe_account_id: null, commission_pct: null };
    expect((await candadosDe("vender", { data: completa, operator_id: "op", actividad: "senderismo" })).ok).toBe(true);
  });

  it("si no se pudo leer a la operadora, muerde (ante la duda, no se vende)", async () => {
    sim.errorOperadora = true;
    const r = await candadosDe("vender", { data: completa, operator_id: "op", actividad: "senderismo" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("operadora");
  });

  it("el orden es el de la conversación: primero lo propio, luego el expediente, luego Connect", async () => {
    sim.actividad = { ok: false, motivo: "no_declarada", actividad: "x", nombre: "X", estado: null, documentos: 1, mensaje: "No declarada." };
    sim.operadora = { ...conectadaLista, commission_pct: null };
    const r = await candadosDe("publicar", { data: sinEncuesta, operator_id: "op", actividad: "x" });
    if (!r.ok) expect(r.motivo).toBe("flujo");
    const r2 = await candadosDe("vender", { data: completa, operator_id: "op", actividad: "x" });
    if (!r2.ok) expect(r2.motivo).toBe("actividad");
  });
});
