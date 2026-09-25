// QUITAR UN DOCUMENTO SUBIDO POR ERROR — y la única vez que no se quita.
//
// Lámina «Panel Operadora»: cada renglón con archivo trae «Quitar». Se va la
// fila y el archivo; lo aprobado no, porque una aprobación puede descansar en
// ese papel. Y un documento ajeno se contesta como inexistente.
import { beforeEach, describe, expect, it, vi } from "vitest";

const st = vi.hoisted(() => ({
  fila: null as null | { id: string; operator_id: string; estado: string; archivo_path: string | null },
  borradas: [] as string[],
  archivosBorrados: [] as string[],
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/auth/alcance", () => ({ operadoraObjetivo: async () => "op-1" }));
vi.mock("@/lib/auth/authorization", () => ({ isCurrentUserAdmin: async () => false, correoEnSesion: async () => "x@y.z" }));
vi.mock("@/lib/operadores/emails", () => ({ emailActividadAprobada: async () => {}, emailExpedienteDevuelto: async () => {} }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    storage: { from: () => ({ remove: async (r: string[]) => { st.archivosBorrados.push(...r); return { error: null }; } }) },
    from: () => {
      let borrar = false;
      const q: Record<string, unknown> = {};
      const enc = () => q;
      q.select = enc;
      q.eq = (col: string, v: string) => { if (borrar && col === "id") st.borradas.push(v); return q; };
      q.delete = () => { borrar = true; return q; };
      q.maybeSingle = async () => ({ data: st.fila, error: null });
      q.then = (res: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(res);
      return q;
    },
  }),
}));

import { quitarDocumento } from "@/lib/operadores/expediente-actions";

beforeEach(() => {
  st.fila = { id: "d1", operator_id: "op-1", estado: "en_revision", archivo_path: "op-1/abc.pdf" };
  st.borradas = []; st.archivosBorrados = [];
});

describe("quitarDocumento", () => {
  it("el subido por error, en revisión ⇒ se va la fila y después el archivo", async () => {
    const r = await quitarDocumento("d1");
    expect(r.ok).toBe(true);
    expect(st.borradas).toEqual(["d1"]);
    expect(st.archivosBorrados).toEqual(["op-1/abc.pdf"]);
  });

  it("rechazado ⇒ también se quita (es el caso más común: subí lo que no era)", async () => {
    st.fila!.estado = "rechazado";
    expect((await quitarDocumento("d1")).ok).toBe(true);
  });

  it("APROBADO ⇒ no; se reemplaza y vuelve a revisión, que es el camino que avisa", async () => {
    st.fila!.estado = "aprobado";
    const r = await quitarDocumento("d1");
    expect(r.ok).toBe(false);
    expect(st.borradas).toEqual([]);
    expect(st.archivosBorrados).toEqual([]);
  });

  it("de OTRA operadora ⇒ «no está en tu expediente», sin confirmar que existe", async () => {
    st.fila!.operator_id = "op-2";
    const r = await quitarDocumento("d1");
    expect(r.ok).toBe(false);
    expect(st.borradas).toEqual([]);
  });

  it("sin id ⇒ no", async () => {
    expect((await quitarDocumento("")).ok).toBe(false);
  });
});
