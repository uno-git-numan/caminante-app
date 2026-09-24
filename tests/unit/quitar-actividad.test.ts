// QUITAR UNA ACTIVIDAD DECLARADA POR ERROR — y las cuatro veces que NO se quita.
//
// Luis, 24 sep 2026: «si me equivoqué y puse cañonismo, la quiero eliminar de
// mi lista». Se borra con sus documentos propios, pero sólo si no sostiene
// nada: una aprobación, un anexo aceptado, una experiencia o una dispensa.
import { beforeEach, describe, expect, it, vi } from "vitest";

const st = vi.hoisted(() => ({
  actividad: null as null | { id: string; estado: string; anexo_aceptado_at: string | null },
  experiencias: [] as { id: string }[],
  dispensas: [] as { vence_at: string; revocada_at: string | null }[],
  docs: [] as { id: string; archivo_path: string | null }[],
  borrados: [] as string[],
  archivosBorrados: [] as string[],
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/auth/alcance", () => ({ operadoraObjetivo: async () => "op-1" }));
vi.mock("@/lib/auth/authorization", () => ({ isCurrentUserAdmin: async () => false, correoEnSesion: async () => "x@y.z" }));
vi.mock("@/lib/operadores/emails", () => ({ emailActividadAprobada: async () => {}, emailExpedienteDevuelto: async () => {} }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    storage: { from: () => ({ remove: async (r: string[]) => { st.archivosBorrados.push(...r); return { error: null }; } }) },
    from: (tabla: string) => {
      let borrar = false;
      const q: Record<string, unknown> = {};
      const enc = () => q;
      q.select = enc; q.eq = enc;
      q.delete = () => { borrar = true; return q; };
      q.maybeSingle = async () => ({ data: tabla === "operator_activities" ? st.actividad : null, error: null });
      q.then = (res: (v: unknown) => unknown) => {
        if (borrar) { st.borrados.push(tabla); return Promise.resolve({ error: null }).then(res); }
        const data = tabla === "experiences" ? st.experiencias
          : tabla === "operator_activity_dispensas" ? st.dispensas
          : tabla === "operator_documents" ? st.docs : [];
        return Promise.resolve({ data, error: null }).then(res);
      };
      return q;
    },
  }),
}));

import { quitarActividad } from "@/lib/operadores/expediente-actions";

beforeEach(() => {
  st.actividad = { id: "act-1", estado: "incompleta", anexo_aceptado_at: null };
  st.experiencias = []; st.dispensas = []; st.docs = [];
  st.borrados = []; st.archivosBorrados = [];
});

describe("quitarActividad", () => {
  it("la declarada por error, sin nada encima ⇒ se quita con sus documentos propios", async () => {
    st.docs = [{ id: "d1", archivo_path: "op-1/a.pdf" }];
    const r = await quitarActividad("senderismo");
    expect(r.ok).toBe(true);
    // Primero las filas de documentos, después la actividad, al final los archivos.
    expect(st.borrados).toEqual(["operator_documents", "operator_activities"]);
    expect(st.archivosBorrados).toEqual(["op-1/a.pdf"]);
  });

  it("APROBADA ⇒ no; darla de baja es suspenderla, y eso es de la casa", async () => {
    st.actividad = { id: "act-1", estado: "aprobada", anexo_aceptado_at: null };
    const r = await quitarActividad("senderismo");
    expect(r.ok).toBe(false);
    expect(st.borrados).toEqual([]);
  });

  it("con su ANEXO aceptado ⇒ no; el recibo legal vive en esa fila", async () => {
    st.actividad = { id: "act-1", estado: "incompleta", anexo_aceptado_at: "2026-09-10T00:00:00Z" };
    expect((await quitarActividad("senderismo")).ok).toBe(false);
    expect(st.borrados).toEqual([]);
  });

  it("con una EXPERIENCIA que dice ser de ella ⇒ no; quedaría apuntando a nada", async () => {
    st.experiencias = [{ id: "e1" }];
    expect((await quitarActividad("senderismo")).ok).toBe(false);
    expect(st.borrados).toEqual([]);
  });

  it("con DISPENSA vigente ⇒ no; la otorgó la casa", async () => {
    st.dispensas = [{ vence_at: "2099-12-31T00:00:00Z", revocada_at: null }];
    expect((await quitarActividad("senderismo")).ok).toBe(false);
    expect(st.borrados).toEqual([]);
  });

  it("una dispensa vencida o revocada ya no la ata", async () => {
    st.dispensas = [{ vence_at: "2020-01-01T00:00:00Z", revocada_at: null }, { vence_at: "2099-01-01T00:00:00Z", revocada_at: "2026-09-01T00:00:00Z" }];
    expect((await quitarActividad("senderismo")).ok).toBe(true);
  });

  it("una actividad que no existe en el catálogo ⇒ no se toca nada", async () => {
    expect((await quitarActividad("surf-lunar")).ok).toBe(false);
    expect(st.borrados).toEqual([]);
  });
});
