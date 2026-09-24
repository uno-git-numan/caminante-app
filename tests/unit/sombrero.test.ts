// EL SOMBRERO — qué ve la casa cuando mira el panel por una de sus operadoras.
//
// Caminante y Kéntro son de Druidas; Nomádika es de alguien más. Hasta el 24 sep
// 2026 el panel con sesión de admin no filtraba por ninguna, así que la
// operación de Nomádika se veía desde la misma pantalla que la propia.
//
// Lo que estas pruebas fijan es la SEPARACIÓN de las dos preguntas: «quién soy»
// (identidad, para firmar y para ser dueño) no sabe del sombrero, y «qué miro»
// (las listas del panel) sí. Juntarlas es el error que empieza recortando una
// lista y termina firmando a nombre de otra.
import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
  alcance: { tipo: "casa" } as { tipo: string; operatorId?: string; nombre?: string; slug?: string | null },
  propias: [] as { id: string; slug: string | null; name: string | null }[],
  cookie: undefined as string | undefined,
  errorAlLeer: false,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === "sombrero_operadora" && estado.cookie ? { value: estado.cookie } : undefined) }),
}));

vi.mock("@/lib/auth/alcance", async () => {
  const real = (a: unknown) => (a as { tipo: string })?.tipo === "operador";
  return {
    alcanceActual: async () => estado.alcance,
    esOperador: real,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      const enc = () => q;
      q.select = enc;
      q.eq = enc;
      q.neq = enc;
      q.order = () =>
        Promise.resolve(
          estado.errorAlLeer
            ? { data: null, error: { code: "42703", message: "column operators.propia does not exist" } }
            : { data: estado.propias, error: null },
        );
      return q;
    },
  }),
}));

import { operadorasPropias, sombreroPuesto } from "@/lib/auth/sombrero";

const CAMINANTE = { id: "op-cam", slug: "numan-caminante", name: "Caminante" };
const KENTRO = { id: "op-ken", slug: "kentro", name: "Kéntro" };

beforeEach(() => {
  estado.alcance = { tipo: "casa" };
  estado.propias = [CAMINANTE, KENTRO];
  estado.cookie = undefined;
  estado.errorAlLeer = false;
});

describe("sombreroPuesto", () => {
  it("sin cookie se pone la PRIMERA propia, no «todas»", async () => {
    // ⚠️ El default ES la decisión. Si sin cookie no se filtrara nada, la
    // operación de Nomádika seguiría a la vista de quien nunca toque la
    // pastilla — o sea, siempre.
    expect((await sombreroPuesto())?.slug).toBe("numan-caminante");
  });

  it("la cookie elige entre las propias", async () => {
    estado.cookie = "kentro";
    expect((await sombreroPuesto())?.id).toBe("op-ken");
  });

  it("una cookie con una operadora AJENA cae al default, no la deja mirar", async () => {
    estado.cookie = "nomadika";
    expect((await sombreroPuesto())?.slug).toBe("numan-caminante");
  });

  it("sin la columna todavía (la 0069 la aplica Luis a mano) no se filtra nada", async () => {
    // Fallar abierto aquí es lo correcto y es la única vez: lo que está en
    // juego no es un permiso, es un recorte de vista. Un panel en blanco se
    // lee como sistema roto, no como decisión.
    estado.errorAlLeer = true;
    expect(await operadorasPropias()).toEqual([]);
    expect(await sombreroPuesto()).toBeNull();
  });

  it("una propia sin slug no puede tener chip: no hay a dónde ligar", async () => {
    estado.propias = [{ id: "op-x", slug: null, name: "Sin dirección" }, KENTRO];
    const l = await operadorasPropias();
    expect(l.map((o) => o.id)).toEqual(["op-ken"]);
  });
});
