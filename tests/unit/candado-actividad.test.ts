// EL CANDADO DE ACTIVIDAD — con la casa exenta y la dispensa como objeto.
//
// Se simula el cliente de Supabase por tabla: `operators` (¿es la casa?),
// `operator_activities` (estado del expediente) y `operator_activity_dispensas`
// (¿hay dispensa vigente?). `anexoAlDia` se simula aparte: sus reglas ya tienen
// dueño en subconvenio.ts.
//
// DESDE EL 23 NOV DE 2026 (convenio v3.5): para publicar basta el expediente
// de ARRANQUE —constancia fiscal e identificación aprobadas— y el anexo
// firmado. La carpeta de la actividad (credencial del guía, permisos) ya no
// detiene la publicación: detiene la salida. `operator_documents` se simula
// con `base.arranque`.
import { beforeEach, describe, expect, it, vi } from "vitest";

const base = vi.hoisted(() => ({
  casa: false,
  estado: null as null | string,
  dispensa: null as null | { motivo: string; autorizada_por: string; vence_at: string },
  errorEnDispensa: false,
  anexo: { exigible: true, firmado: false },
  /** Los dos documentos de arranque, con su estado. `null` = no los ha subido. */
  arranque: { csf: "aprobado", id: "aprobado" } as { csf: string | null; id: string | null },
  tipoPersona: "fisica" as string | null,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (tabla: string) => {
      const q: Record<string, unknown> = {};
      const enc = () => q;
      for (const m of ["select", "eq", "is", "gt", "order", "limit"]) q[m] = enc;
      // La consulta de documentos se espera directo (sin maybeSingle).
      if (tabla === "operator_documents") {
        const filas = [
          base.arranque.csf ? { actividad: null, documento: "csf", estado: base.arranque.csf, motivo: null, vence_at: null } : null,
          base.arranque.id ? { actividad: null, documento: "id-responsable", estado: base.arranque.id, motivo: null, vence_at: "2099-12-31" } : null,
        ].filter(Boolean);
        q.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: filas, error: null }).then(ok);
      }
      q.maybeSingle = async () => {
        if (tabla === "operators") return { data: { es_la_casa: base.casa, tipo_persona: base.tipoPersona }, error: null };
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
  base.arranque = { csf: "aprobado", id: "aprobado" };
  base.tipoPersona = "fisica";
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

  it("la carpeta de la actividad ya no detiene la publicación: incompleta o en revisión publican con arranque y anexo", async () => {
    base.anexo = { exigible: true, firmado: true };
    for (const e of ["incompleta", "en_revision", "aprobada"]) {
      base.estado = e;
      expect(await actividadListaParaPublicar(OP, "senderismo")).toEqual({ ok: true });
    }
  });

  it("suspendida: no_aprobada, aunque tenga arranque y anexo", async () => {
    base.estado = "suspendida";
    base.anexo = { exigible: true, firmado: true };
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("no_aprobada");
  });

  it("sin el expediente de arranque: sin_arranque, y dice cuál falta", async () => {
    base.estado = "incompleta";
    base.anexo = { exigible: true, firmado: true };
    base.arranque = { csf: null, id: "aprobado" };
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("sin_arranque");
      expect(r.mensaje).toContain("constancia de situación fiscal");
      expect(r.mensaje).toContain("antes de tu primera salida");
    }
  });

  it("arranque entregado pero sin aprobar: sin_arranque, y dice que está en revisión", async () => {
    base.estado = "incompleta";
    base.arranque = { csf: "en_revision", id: "aprobado" };
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe("sin_arranque");
      expect(r.mensaje).toContain("revisando");
    }
  });

  it("sin decir si es física o moral no hay arranque", async () => {
    base.estado = "incompleta";
    base.tipoPersona = null;
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("sin_arranque");
  });

  it("con arranque pero sin anexo firmado: sin_anexo; con anexo, pasa", async () => {
    base.estado = "incompleta";
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("sin_anexo");
    base.anexo = { exigible: true, firmado: true };
    expect(await actividadListaParaPublicar(OP, "senderismo")).toEqual({ ok: true });
  });

  it("EL CASO KÉNTRO: sin arranque + dispensa vigente ⇒ publica, y lo dice en voz alta", async () => {
    base.estado = "incompleta";
    base.arranque = { csf: null, id: null };
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

  it("con arranque y anexo firmado, la dispensa ni se pregunta ni se enseña", async () => {
    base.estado = "incompleta";
    base.anexo = { exigible: true, firmado: true };
    base.dispensa = vigente;
    expect(await actividadListaParaPublicar(OP, "senderismo")).toEqual({ ok: true });
  });

  it("si la lectura de la dispensa falla, el candado muerde (ante la duda, no hay dispensa)", async () => {
    base.estado = "incompleta";
    base.arranque = { csf: null, id: null };
    base.dispensa = vigente;
    base.errorEnDispensa = true;
    const r = await actividadListaParaPublicar(OP, "senderismo");
    expect(r.ok).toBe(false);
  });
});
