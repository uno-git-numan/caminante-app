// EL ALTA DE LA CUENTA DE COBRO DENTRO DE LA PLATAFORMA — lo puro y la bandera.
//
// Nace apagada (Luis: «construye el alta apagada», 24 sep 2026) porque la
// aceptación que Stripe exige vive en la Cuarta §7 del convenio, que el abogado
// no ha cerrado. Lo primero que se afirma es eso: sin `COBRO_EN_PLATAFORMA=1`
// no cambia nada de lo que hoy mueve dinero.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  altaCobroEnPlataforma, clabeValida, erroresDeVerificacion, nacimientoDe, recaudaLaPlataforma,
  rfcValido, sinVacios, telefonoE164, traducirPendientes,
} from "@/lib/payments/alta-cobro";

describe("la bandera", () => {
  it("apagada por omisión, y con cualquier valor que no sea «1»", () => {
    expect(altaCobroEnPlataforma({})).toBe(false);
    expect(altaCobroEnPlataforma({ COBRO_EN_PLATAFORMA: "true" })).toBe(false);
    expect(altaCobroEnPlataforma({ COBRO_EN_PLATAFORMA: "0" })).toBe(false);
    expect(altaCobroEnPlataforma({ COBRO_EN_PLATAFORMA: "1" })).toBe(true);
  });
});

describe("clabeValida", () => {
  it("acepta la CLABE de prueba de Stripe para México (el dígito verificador cuadra)", () => {
    expect(clabeValida("000000001234567897")).toBe(true);
    expect(clabeValida("0000 0000 1234 5678 97")).toBe(true);
  });
  it("rechaza un dígito cambiado, 17 dígitos y letras", () => {
    expect(clabeValida("000000001234567898")).toBe(false);
    expect(clabeValida("00000000123456789")).toBe(false);
    expect(clabeValida("00000000123456789A")).toBe(false);
    expect(clabeValida("")).toBe(false);
  });
});

describe("forma de los datos", () => {
  it("RFC de 12 y de 13", () => {
    expect(rfcValido("NHU250826CS8")).toBe(true);
    expect(rfcValido("robl990531hi3")).toBe(true);
    expect(rfcValido("NHU2508")).toBe(false);
  });
  it("teléfono: 10 dígitos de México → E.164; uno con + se respeta", () => {
    expect(telefonoE164("55 1234 5678")).toBe("+525512345678");
    expect(telefonoE164("+34600000000")).toBe("+34600000000");
    expect(telefonoE164("123")).toBeNull();
  });
  it("nacimiento", () => {
    expect(nacimientoDe("1990-05-31")).toEqual({ day: 31, month: 5, year: 1990 });
    expect(nacimientoDe("31/05/1990")).toBeNull();
    expect(nacimientoDe("1990-13-01")).toBeNull();
  });
});

describe("sinVacios — un token de actualización sólo lleva lo que cambia", () => {
  it("quita cadenas vacías y objetos que quedan vacíos; conserva false y 0", () => {
    expect(sinVacios({ a: "", b: { c: "  ", d: "x" }, e: { f: "" }, g: false, h: 0, i: [""] }))
      .toEqual({ b: { d: "x" }, g: false, h: 0 });
    expect(sinVacios({ a: "" })).toBeUndefined();
    expect(sinVacios("  hola ")).toBe("hola");
  });
});

describe("traducirPendientes — la operadora lee palabras, no claves", () => {
  it("junta las tres partes de la fecha en una y nombra al sujeto", () => {
    expect(traducirPendientes(["individual.dob.day", "individual.dob.month", "individual.dob.year"]))
      .toEqual(["fecha de nacimiento"]);
    expect(traducirPendientes(["representative.verification.document", "owners.address.line1", "company.tax_id"]))
      .toEqual(["identificación oficial (foto) del representante legal", "domicilio de un dueño", "RFC de la empresa"]);
    expect(traducirPendientes(["external_account", "tos_acceptance.date", "business_profile.mcc"]))
      .toEqual(["cuenta bancaria (CLABE)", "aceptación del convenio", "giro y sitio (los pone Caminante)"]);
  });
  it("una clave que no conoce se enseña en crudo, no se esconde", () => {
    expect(traducirPendientes(["settings.payouts.something_new"])).toEqual(["settings.payouts.something_new"]);
  });
  it("nunca dice «Stripe»", () => {
    const todo = traducirPendientes([
      "individual.first_name", "individual.id_number", "company.owners_provided", "external_account",
      "tos_acceptance.ip", "representative.relationship.title", "individual.verification.additional_document",
    ]).join(" ");
    expect(todo).not.toMatch(/stripe/i);
  });
});

describe("recaudaLaPlataforma y errores", () => {
  it("sólo con requirement_collection = application", () => {
    expect(recaudaLaPlataforma({ controller: { requirement_collection: "application" } })).toBe(true);
    expect(recaudaLaPlataforma({ controller: { requirement_collection: "stripe" } })).toBe(false);
    expect(recaudaLaPlataforma({})).toBe(false);
    expect(recaudaLaPlataforma(null)).toBe(false);
  });
  it("traduce el campo y conserva la razón", () => {
    expect(erroresDeVerificacion([{ requirement: "individual.id_number", reason: "No cuadra con el nombre.", code: "x" }]))
      .toEqual([{ campo: "RFC", mensaje: "No cuadra con el nombre." }]);
    expect(erroresDeVerificacion(undefined)).toEqual([]);
  });
});

// ── completarAltaCobro: qué le manda a Stripe, y cuándo se niega ─────────────

const st = vi.hoisted(() => ({
  env: "" as string,
  fila: null as Record<string, unknown> | null,
  creadas: [] as Record<string, unknown>[],
  actualizadas: [] as [string, Record<string, unknown>][],
  personas: [] as [string, Record<string, unknown>][],
  recuperada: { id: "acct_x", controller: { requirement_collection: "stripe" } } as Record<string, unknown>,
  escrituras: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/payments/stripe", () => ({
  getStripeServerClient: () => ({
    accounts: {
      create: async (p: Record<string, unknown>) => { st.creadas.push(p); return { id: "acct_nueva", requirements: { currently_due: ["external_account"] }, controller: { requirement_collection: "application" } }; },
      update: async (id: string, p: Record<string, unknown>) => { st.actualizadas.push([id, p]); return { id }; },
      createPerson: async (id: string, p: Record<string, unknown>) => { st.personas.push([id, p]); return { id: "person_1" }; },
      retrieve: async () => st.recuperada,
    },
  }),
}));
vi.mock("@/lib/operadores/emails", () => ({ emailStripeListo: async () => undefined }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      const enc = () => q;
      q.select = enc; q.eq = enc; q.is = enc;
      q.update = (p: Record<string, unknown>) => {
        st.escrituras.push(p);
        // La fila aprende el id de la cuenta recién creada, como la base real.
        if (p.stripe_account_id && st.fila) st.fila = { ...st.fila, stripe_account_id: p.stripe_account_id };
        return q;
      };
      q.maybeSingle = async () => ({ data: st.fila, error: null });
      q.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null }).then(res);
      return q;
    },
  }),
}));

import { completarAltaCobro } from "@/lib/payments/connect";

beforeEach(() => {
  st.creadas = []; st.actualizadas = []; st.personas = []; st.escrituras = [];
  st.fila = { id: "op-1", name: "Kéntro", email: "k@example.com", slug: "kentro", tipo_persona: "fisica", stripe_account_id: null, stripe_onboarded_at: null };
  delete process.env.COBRO_EN_PLATAFORMA;
});

describe("completarAltaCobro", () => {
  it("apagada: se niega sin tocar Stripe", async () => {
    const r = await completarAltaCobro("op-1", { accountToken: "ctoken_1" });
    expect(r.ok).toBe(false);
    expect(st.creadas).toHaveLength(0);
  });

  it("prendida y sin cuenta: la crea con propiedades de control, el token, el giro, y SIN type express", async () => {
    process.env.COBRO_EN_PLATAFORMA = "1";
    st.recuperada = { id: "acct_nueva", controller: { requirement_collection: "application" }, requirements: { currently_due: ["external_account"] } };
    const r = await completarAltaCobro("op-1", { accountToken: "ctoken_1", bankToken: "btok_1" });
    expect(r.ok).toBe(true);
    expect(st.creadas).toHaveLength(1);
    const c = st.creadas[0] as { type?: string; controller?: Record<string, unknown>; account_token?: string; business_profile?: Record<string, unknown>; business_type?: string };
    expect(c.type).toBeUndefined();
    expect(c.controller).toEqual({
      stripe_dashboard: { type: "none" }, fees: { payer: "application" }, losses: { payments: "application" }, requirement_collection: "application",
    });
    expect(c.account_token).toBe("ctoken_1");
    expect(c.business_type).toBe("individual");
    expect(c.business_profile?.mcc).toBe("4722");
    expect(st.actualizadas).toEqual([["acct_nueva", { external_account: "btok_1" }]]);
    // La primera escritura guarda el id de la cuenta.
    expect(st.escrituras[0]).toEqual({ stripe_account_id: "acct_nueva" });
  });

  it("prendida y sin cuenta, pero sin token de cuenta: no crea nada a medias", async () => {
    process.env.COBRO_EN_PLATAFORMA = "1";
    const r = await completarAltaCobro("op-1", { bankToken: "btok_1" });
    expect(r.ok).toBe(false);
    expect(st.creadas).toHaveLength(0);
    expect(st.actualizadas).toHaveLength(0);
  });

  it("una cuenta que ya salió a Stripe (Express) no se completa desde aquí", async () => {
    process.env.COBRO_EN_PLATAFORMA = "1";
    st.fila = { ...st.fila!, stripe_account_id: "acct_x" };
    st.recuperada = { id: "acct_x", controller: { requirement_collection: "stripe" } };
    const r = await completarAltaCobro("op-1", { accountToken: "ctoken_2" });
    expect(r.ok).toBe(false);
    expect(st.actualizadas).toHaveLength(0);
  });

  it("una cuenta de la plataforma se actualiza con el token y recibe a las personas", async () => {
    process.env.COBRO_EN_PLATAFORMA = "1";
    st.fila = { ...st.fila!, stripe_account_id: "acct_p", tipo_persona: "moral" };
    st.recuperada = { id: "acct_p", controller: { requirement_collection: "application" }, requirements: { currently_due: [] }, charges_enabled: false };
    const r = await completarAltaCobro("op-1", { accountToken: "ctoken_3", personTokens: ["ptoken_a", "ptoken_b"] });
    expect(r.ok).toBe(true);
    expect(st.creadas).toHaveLength(0);
    expect(st.actualizadas).toEqual([["acct_p", { account_token: "ctoken_3" }]]);
    expect(st.personas).toEqual([["acct_p", { person_token: "ptoken_a" }], ["acct_p", { person_token: "ptoken_b" }]]);
  });

  it("apagada: la cuenta nueva sigue siendo Express, como hoy", async () => {
    const { crearCuentaConectada } = await import("@/lib/payments/connect");
    const r = await crearCuentaConectada("op-1");
    expect(r.ok).toBe(true);
    expect((st.creadas[0] as { type?: string }).type).toBe("express");
    expect((st.creadas[0] as { controller?: unknown }).controller).toBeUndefined();
  });
});
