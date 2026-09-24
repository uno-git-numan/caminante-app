// MI ALTA — «la fila manda» (Luis, 22 sep 2026).
//
// El lazo que dejó a Nomádika sin poder subir un documento: su fila en
// `operators` estaba activa y su solicitud, reabierta, en `calling`. La función
// le creía a la solicitud y devolvía `operadora: null`, que es lo que la página
// del expediente usa para rebotar. Estas pruebas fijan la regla nueva: con fila
// ACTIVA se lee el alta de sus candados; el embudo sólo manda cuando no hay fila
// o la que hay no está activa.
import { beforeEach, describe, expect, it, vi } from "vitest";

const estado = vi.hoisted(() => ({
  email: "catalina@example.com" as string | null,
  fila: null as null | { id: string; estado: string; estado_motivo: string | null },
  solicitud: null as null | Record<string, unknown>,
  operadoras: [] as unknown[],
  /** El correo con el que está dada de alta la operadora que se pide por id. */
  correoDeFila: null as string | null,
}));

vi.mock("@/lib/auth/authorization", () => ({
  correoEnSesion: async () => estado.email,
}));

vi.mock("@/lib/plataforma/operadoras", () => ({
  fetchOperadorasPlataforma: async () => estado.operadoras,
}));

// El cliente de Supabase, reducido a las dos consultas que hace `fetchMiAlta`.
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (tabla: string) => {
      const q: Record<string, unknown> = {};
      let columnas = "";
      const enc = () => q;
      // El `select` se recuerda porque `fetchMiAlta(id)` hace DOS consultas a
      // `operators` con formas distintas: primero el correo de esa operadora y
      // luego su fila. Un mock que devuelve lo mismo a las dos no puede
      // distinguir «no existe esa operadora» de «existe y no tiene alta».
      q.select = (c: string) => { columnas = c; return q; };
      q.eq = enc;
      q.ilike = enc;
      q.order = enc;
      q.limit = enc;
      q.maybeSingle = async () => ({
        data:
          tabla !== "operators"
            ? null
            : columnas === "email"
              ? (estado.correoDeFila ? { email: estado.correoDeFila } : null)
              : estado.fila,
        error: null,
      });
      // `.limit(1)` sin `.maybeSingle()` devuelve la lista (solicitudes).
      q.then = (res: (v: unknown) => unknown) =>
        Promise.resolve({ data: tabla === "operator_applications" && estado.solicitud ? [estado.solicitud] : [], error: null }).then(res);
      return q;
    },
  }),
}));

import { fetchMiAlta } from "@/lib/operadores/mi-alta";

const solicitud = (status: string) => ({
  id: "app-1",
  status,
  created_at: "2026-08-25T00:00:00Z",
  llamada_at: null,
  llamada_meet_url: null,
  expediente: [],
  motivo_publico: null,
  reabre_at: null,
});

const filaActiva = { id: "op-nomadika", estado: "activa", estado_motivo: null };

const operadoraSinCandados = {
  id: "op-nomadika",
  esLaCasa: false,
  puedeArmar: false,
  puedeCobrar: false,
  candados: [
    { clave: "convenio", nombre: "Convenio firmado", cumplido: false, toca: "casa", bloquea: "armar" },
    { clave: "panel", nombre: "Panel activo", cumplido: true, toca: "casa", bloquea: "armar" },
  ],
};

beforeEach(() => {
  estado.email = "catalina@example.com";
  estado.fila = null;
  estado.solicitud = null;
  estado.operadoras = [];
  estado.correoDeFila = null;
});

describe("fetchMiAlta — la fila manda", () => {
  it("sin sesión no hay alta", async () => {
    estado.email = null;
    expect(await fetchMiAlta()).toBeNull();
  });

  it("sin fila y sin solicitud: nada que mostrar", async () => {
    expect(await fetchMiAlta()).toBeNull();
  });

  it("sin fila, la solicitud cuenta su recorrido", async () => {
    estado.solicitud = solicitud("calling");
    const r = await fetchMiAlta();
    expect(r?.estado).toBe("llamada");
    expect(r?.operadora).toBeNull();
  });

  it("EL CASO NOMÁDIKA: fila activa + solicitud reabierta en «calling» ⇒ es operadora, con expediente", async () => {
    estado.fila = filaActiva;
    estado.solicitud = solicitud("calling");
    estado.operadoras = [operadoraSinCandados];
    const r = await fetchMiAlta();
    expect(r?.operadora?.id).toBe("op-nomadika"); // ← antes: null, y la página rebotaba
    expect(r?.estado).toBe("por_firmar");
    expect(r?.solicitud?.status).toBe("calling"); // el embudo se conserva como historia
  });

  it("fila activa sin solicitud (alta manual): igual, es operadora", async () => {
    estado.fila = filaActiva;
    estado.operadoras = [{ ...operadoraSinCandados, puedeArmar: true }];
    const r = await fetchMiAlta();
    expect(r?.operadora?.id).toBe("op-nomadika");
    expect(r?.estado).toBe("armando");
  });

  it("fila NO activa (baja) con solicitud en recorrido: manda el recorrido", async () => {
    estado.fila = { ...filaActiva, estado: "baja" };
    estado.solicitud = solicitud("docs");
    const r = await fetchMiAlta();
    expect(r?.operadora).toBeNull();
    expect(r?.estado).toBe("expediente");
  });

  it("fila suspendida sin solicitud: se dice suspendida, no se esconde", async () => {
    estado.fila = { ...filaActiva, estado: "suspendida", estado_motivo: "Incidente" };
    estado.operadoras = [operadoraSinCandados];
    const r = await fetchMiAlta();
    expect(r?.estado).toBe("suspendida");
    expect(r?.estadoMotivo).toBe("Incidente");
  });

  it("los seis candados cuentan ANTES de que nadie rechace: solicitud rechazada con fila activa sigue siendo operadora", async () => {
    estado.fila = filaActiva;
    estado.solicitud = solicitud("rejected");
    estado.operadoras = [{ ...operadoraSinCandados, puedeArmar: true, puedeCobrar: true }];
    const r = await fetchMiAlta();
    expect(r?.operadora?.id).toBe("op-nomadika");
    expect(r?.estado).toBe("listo");
  });
});

// ── LA CASA ACTUANDO POR OTRA ───────────────────────────────────────────────
//
// El alta se hace acompañada: Luis captura por la operadora durante la llamada.
// Hasta el 24 sep 2026 podía entrar por separado a su expediente, a su cobro y
// a su marca con `?operadora=`, pero la pantalla que junta el recorrido rebotaba
// — la única que enseña en qué paso va era la única cerrada para quien lo
// acompaña.
describe("fetchMiAlta(porOperadora) — leer el alta de otra", () => {
  it("lee por el correo de ESA operadora, no por el de la sesión", async () => {
    // La sesión es de la casa; la operadora pedida es otra.
    estado.email = "uno@numanhub.com";
    estado.correoDeFila = "catalina@example.com";
    estado.fila = filaActiva;
    estado.operadoras = [operadoraSinCandados];
    const a = await fetchMiAlta("op-nomadika");
    expect(a?.operadora?.id).toBe("op-nomadika");
  });

  it("un id que no existe no cae de vuelta en la sesión: devuelve null", async () => {
    // ⚠️ ESTE ES EL IMPORTANTE. Si al no encontrar el correo la función siguiera
    // con el de la sesión, pedir una operadora inventada le enseñaría —y le
    // haría capturar— su PROPIA alta creyendo que es la de ella.
    estado.email = "catalina@example.com";
    estado.correoDeFila = null;
    estado.fila = filaActiva;
    estado.operadoras = [operadoraSinCandados];
    expect(await fetchMiAlta("op-que-no-existe")).toBeNull();
  });

  it("sin argumento sigue siendo la de la sesión", async () => {
    estado.email = "catalina@example.com";
    estado.correoDeFila = "otra@example.com";
    estado.fila = filaActiva;
    estado.operadoras = [operadoraSinCandados];
    const a = await fetchMiAlta();
    expect(a?.operadora?.id).toBe("op-nomadika");
  });
});
