// EL EQUIPO (0070) — lo puro: facultades, listas blancas y el orden de los roles.
//
// Luis (25 sep 2026): un tercer rol con sueldo, permisos que él prende y apaga,
// nunca dinero ni llaves. Lo que se afirma aquí es que un asiento de equipo no
// abre nada que no se haya prendido, y que nunca se confunde con la casa.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FACULTADES_DE_OPERADORA, facultadesDe, tieneFacultad } from "@/lib/equipo/facultades";
import { rutaDeEquipoNuman, rutaDeEquipoOperadora, rutaDeOperador } from "@/lib/auth/panel-operador";

describe("facultades", () => {
  it("limpia lo que llega de un formulario: sólo las cuatro, sin repetir, sin inventos", () => {
    expect(facultadesDe(["armar", "dinero", "armar", "campo", 3])).toEqual(["armar", "campo"]);
    expect(facultadesDe(undefined)).toEqual([]);
  });
  it("una operadora nunca puede dar «onboarding»: es de la plataforma", () => {
    expect(FACULTADES_DE_OPERADORA).not.toContain("onboarding");
    expect(FACULTADES_DE_OPERADORA).toEqual(["clientes", "armar", "campo"]);
  });
  it("tieneFacultad falla cerrado", () => {
    expect(tieneFacultad(null, "armar")).toBe(false);
    expect(tieneFacultad({ facultades: ["armar"] }, "campo")).toBe(false);
    expect(tieneFacultad({ facultades: ["armar"] }, "armar")).toBe(true);
  });
});

describe("listas blancas del equipo", () => {
  it("el equipo de numan: Comunidad de la plataforma y las pantallas por operadora; nunca dinero ni cobro", () => {
    expect(rutaDeEquipoNuman("/caminante/admin/plataforma/comunidad")).toBe(true);
    expect(rutaDeEquipoNuman("/caminante/admin/mi-alta")).toBe(true);
    expect(rutaDeEquipoNuman("/caminante/admin/mi-alta/expediente")).toBe(true);
    expect(rutaDeEquipoNuman("/caminante/admin/plataforma")).toBe(false);
    expect(rutaDeEquipoNuman("/caminante/admin/plataforma/recursos")).toBe(false);
    expect(rutaDeEquipoNuman("/caminante/admin/plataforma/equipo")).toBe(false);
    expect(rutaDeEquipoNuman("/caminante/admin/mi-alta/cobrar")).toBe(false);
    expect(rutaDeEquipoNuman("/caminante/admin")).toBe(false);
    expect(rutaDeEquipoNuman(null)).toBe(false);
  });
  it("el equipo de una operadora: lo mismo que ella, menos administrar al equipo", () => {
    expect(rutaDeOperador("/caminante/admin/mi-alta/equipo")).toBe(true);
    expect(rutaDeEquipoOperadora("/caminante/admin/mi-alta/equipo")).toBe(false);
    expect(rutaDeEquipoOperadora("/caminante/admin/comunidad")).toBe(true);
    expect(rutaDeEquipoOperadora("/caminante/admin/plataforma/recursos")).toBe(false);
  });
});

// ── El orden de los roles: casa → equipo → operador → caminante ─────────────

const st = vi.hoisted(() => ({
  email: "ana@numanhub.com" as string | null,
  admin: false,
  staff: false,
  staffError: false,
  operador: false,
}));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({}) }));
vi.mock("@/lib/auth/sesion-rota", () => ({ esSesionMuerta: () => false }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (tabla: string) => {
      const q: Record<string, unknown> = {};
      const enc = () => q;
      q.select = enc; q.eq = enc;
      q.maybeSingle = async () =>
        tabla === "staff"
          ? st.staffError ? { data: null, error: { message: "no existe" } } : { data: st.staff ? { id: "s1" } : null, error: null }
          : tabla === "operators"
            ? { data: st.operador ? { id: "op-1" } : null, error: null }
            : { data: null, error: null };
      return q;
    },
  }),
}));

import { roleForClient } from "@/lib/auth/authorization";

const clienteDeSesion = () =>
  ({
    auth: { getUser: async () => ({ data: { user: st.email ? { email: st.email } : null } }) },
    from: () => {
      const q: Record<string, unknown> = {};
      const enc = () => q;
      q.select = enc; q.eq = enc;
      q.maybeSingle = async () => ({ data: st.admin ? { email: st.email } : null, error: null });
      return q;
    },
  }) as never;

beforeEach(() => {
  st.email = "ana@numanhub.com"; st.admin = false; st.staff = false; st.staffError = false; st.operador = false;
});

describe("roleForClient con el equipo", () => {
  it("fila activa en staff ⇒ equipo", async () => {
    st.staff = true;
    expect(await roleForClient(clienteDeSesion())).toBe("equipo");
  });
  it("la casa manda aunque también esté en staff", async () => {
    st.admin = true; st.staff = true;
    expect(await roleForClient(clienteDeSesion())).toBe("admin");
  });
  it("equipo antes que operador", async () => {
    st.staff = true; st.operador = true;
    expect(await roleForClient(clienteDeSesion())).toBe("equipo");
  });
  it("si staff no se puede leer (la tabla no existe aún), nadie gana asiento: se sigue a operador", async () => {
    st.staffError = true; st.operador = true;
    expect(await roleForClient(clienteDeSesion())).toBe("operador");
    st.operador = false;
    expect(await roleForClient(clienteDeSesion())).toBe("caminante");
  });
});
