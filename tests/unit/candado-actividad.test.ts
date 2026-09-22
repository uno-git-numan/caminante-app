// EL CANDADO DE ACTIVIDAD — con la casa exenta y la dispensa como objeto.
//
// Se simula el cliente de Supabase por tabla: `operators` (¿es la casa?),
// `operator_activities` (estado del expediente) y `operator_activity_dispensas`
// (¿hay dispensa vigente?). `anexoAlDia` se simula aparte: sus reglas ya tienen
// dueño en subconvenio.ts.
import { beforeEach, describe, expect, it, vi } from "vitest";

const base = vi.hoisted(() => ({
  casa: false,
  estado: null as null | string,
  dispensa: null as null | { motivo: string; autorizada_por: string; vence_at: string },
  errorEnDispensa: false,
  anexo: { exigible: true, firmado: false },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (tabla: string) => {
      const q: Record<string, unknown> = {};
      const enc = () => q;
      for (const m of ["select", "eq", "is", "gt", "order", "limit"]) q[m] = enc;
      q.maybeSingle = async () => {
        if (tabla === "operators") return { data: { es_la_casa: base.casa }, error: null };
        if (tabla === "operator_activities") return { data: base.estado ? { estado: base.estado } : null, error: null };
        if (tabla === "operator_activity_dispensas") {
          if (base.errorEnDispensa) return { data: null, error: { message: "boom" } };
          return { data: base.dispensa, error: null };
        }
        return { data: null, error: null };
      };
      return q;
    },
  }),
}));

vi.mock("@/lib/operadores/subconvenio", () => ({
  anexoAlDia: async () => base.anexo,
}));

import { actividadListaParaPublicar } from "@/lib/operadores/candado-actividad";

const OP = "op-kentro";
const vigente = { motivo: "Certificación de senderismo en trámite", autorizada_por: "uno@numanhub.com", vence_at: "2099-01-01T00:00:00Z" };

beforeEach(() => {
  base.casa = false;
  base.estado = null;
  base.dispensa = null;
  base.errorEnDispensa = false;
  base.anexo = { exigible: true, firmado: false };
});

describe("actividadListaParaPublicar", () => {
  it("sin operadora, o siendo la casa, no hay expediente que pedir", async () => {
    expect(await actividadListaParaPublicar(null, "senderismo")).toEqual({ ok: true });
    base.casa = true;
    expect(await actividadListaParaPublicar(OP, null)).toEqual({ ok: true });
  });

  it("sin actividad declarada en la experiencia: sin_actividad", async () => {
    const r = await actividadListaParaPublicar(OP, "");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("sin_actividad");
  });

  it("actividad no declarada en el expediente: no_declarada", async () => {
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("no_declarada");
      expect(r.nombre).toBe("Senderismo y caminata"); // el nombre lo dicta el catálogo
    }
  });

  it("incompleta / en_revision / suspendida: no_aprobada, con su frase", async () => {
    for (const e of ["incompleta", "en_revision", "suspendida"]) {
      base.estado = e;
      const r = await actividadListaParaPublicar(OP, "senderismo");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.motivo).toBe("no_aprobada");
    }
  });

  it("aprobada pero sin anexo firmado: sin_anexo; con anexo, pasa", async () => {
    base.estado = "aprobada";
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("sin_anexo");
    base.anexo = { exigible: true, firmado: true };
    expect(await actividadListaParaPublicar(OP, "senderismo")).toEqual({ ok: true });
  });

  it("EL CASO KÉNTRO: senderismo incompleta + dispensa vigente ⇒ publica, y lo dice en voz alta", async () => {
    base.estado = "incompleta";
    base.dispensa = vigente;
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dispensa).toEqual({ motivo: vigente.motivo, autorizadaPor: "uno@numanhub.com", venceAt: vigente.vence_at });
  });

  it("la dispensa también cubre el anexo sin firmar", async () => {
    base.estado = "aprobada";
    base.dispensa = vigente;
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dispensa?.motivo).toBe(vigente.motivo);
  });

  it("con la actividad aprobada y el anexo firmado, la dispensa ni se pregunta ni se enseña", async () => {
    base.estado = "aprobada";
    base.anexo = { exigible: true, firmado: true };
    base.dispensa = vigente;
    expect(await actividadListaParaPublicar(OP, "senderismo")).toEqual({ ok: true });
  });

  it("si la lectura de la dispensa falla, el candado muerde (ante la duda, no hay dispensa)", async () => {
    base.estado = "incompleta";
    base.dispensa = vigente;
    base.errorEnDispensa = true;
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
  });
});
