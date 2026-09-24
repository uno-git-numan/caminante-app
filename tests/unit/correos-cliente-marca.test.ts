// EL CORREO AL CLIENTE, VESTIDO DE QUIEN OPERA.
//
// ⚠️ EN UN CORREO NO HAY VARIABLES CSS. El resto del funnel se viste con una
// clase y un <style>; Gmail tira los <style> y `var()` no resuelve en la mitad
// de los clientes, así que aquí los colores se interpolan en cada `style=""`.
// Es el mismo tema por otro camino — y por eso hay que probarlo aparte: un
// cambio en `themeCssFor` no protege a estos correos.
//
// Lo que se afirma: que con marca se pinta la suya, que sin marca NO cambia
// nada, y que el rastro de quién presta la plataforma no desaparece nunca.
import { beforeEach, describe, expect, it, vi } from "vitest";

const enviados: { asunto: string; html: string }[] = [];
vi.mock("@/lib/email/resend", () => ({
  sendViaResend: async (_to: string, subject: string, html: string) => {
    enviados.push({ asunto: subject, html });
    return true;
  },
}));

const MARCA = {
  colors: { primary: "#7b2d8e", accent: "#f0a500", bg: "#fffdf5", ink: "#1a1020" },
  logoUrl: "https://ejemplo.mx/nomadika.png",
};

// La base: una operadora externa con marca completa, o la casa.
const filas: Record<string, { es_la_casa: boolean }> = {
  "op-marca": { es_la_casa: false },
  "op-casa": { es_la_casa: true },
  "op-sin-marca": { es_la_casa: false },
};
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: (_c: string, id: string) => ({ maybeSingle: async () => ({ data: filas[id] ?? null }) }) }),
    }),
  }),
}));
vi.mock("@/lib/operators/branding", () => ({
  fetchOperatorTheme: async (id: string) =>
    id === "op-marca"
      ? { operatorId: id, slug: "nomadika", name: "Nomádika", branding: MARCA, marcaCompleta: true, legal: null, razonSocial: null }
      : { operatorId: id, slug: null, name: "Sin marca", branding: null, marcaCompleta: false, legal: null, razonSocial: null },
}));

import { notifyConfirmacionCompra } from "@/lib/notifications/notify-customer";

const base = {
  email: "viajera@ejemplo.mx",
  nombre: "Renata Paz",
  experiencia: "Corral de Piedra",
  salida: "Sep 19–20",
  personas: 2,
  montoMxn: 3500,
};
const ultimo = () => enviados[enviados.length - 1];

beforeEach(() => {
  enviados.length = 0;
});

describe("con la marca de la operadora", () => {
  it("pinta sus colores, no los de Caminante", async () => {
    await notifyConfirmacionCompra({ ...base, operatorId: "op-marca" });
    expect(ultimo().html).toContain("#7b2d8e");
    expect(ultimo().html).toContain("#fffdf5");
    // El verde de la casa no debe quedar ni un rastro en el cuerpo.
    expect(ultimo().html).not.toContain("#3e4836");
  });

  it("pone su logo y su nombre", async () => {
    await notifyConfirmacionCompra({ ...base, operatorId: "op-marca" });
    expect(ultimo().html).toContain("https://ejemplo.mx/nomadika.png");
    expect(ultimo().html).toContain("Nomádika");
  });

  // ⚠️ Esto no se quita nunca. Quien compró tiene que poder saber a quién le
  // reclama, y el correo sale de un dominio de Caminante: esconderlo sería
  // vender una tienda que no existe.
  it("«vía Caminante» sigue ahí, aunque la marca esté completa", async () => {
    await notifyConfirmacionCompra({ ...base, operatorId: "op-marca" });
    expect(ultimo().html).toContain("vía Caminante");
  });
});

describe("cuando NO hay marca, nada cambia", () => {
  it("la casa manda su propio correo de siempre", async () => {
    await notifyConfirmacionCompra({ ...base, operatorId: "op-casa" });
    expect(ultimo().html).toContain("#3e4836");
    expect(ultimo().html).toContain("Naturaleza en movimiento");
    expect(ultimo().html).not.toContain("vía Caminante");
  });

  it("una operadora sin marca capturada también", async () => {
    await notifyConfirmacionCompra({ ...base, operatorId: "op-sin-marca" });
    expect(ultimo().html).toContain("#3e4836");
    expect(ultimo().html).toContain("Naturaleza en movimiento");
  });

  it("sin operador —el caso viejo— sale idéntico al de la casa", async () => {
    await notifyConfirmacionCompra(base);
    const sinOperador = ultimo().html;
    await notifyConfirmacionCompra({ ...base, operatorId: "op-casa" });
    expect(sinOperador).toBe(ultimo().html);
  });
});

describe("el comprobante dice lo mismo, vestido o no", () => {
  it("los datos del viaje no dependen de la marca", async () => {
    for (const operatorId of ["op-marca", "op-casa"]) {
      await notifyConfirmacionCompra({ ...base, operatorId });
      expect(ultimo().html).toContain("Corral de Piedra");
      expect(ultimo().html).toContain("Sep 19–20");
      expect(ultimo().html).toContain("$3,500 MXN");
    }
  });
});
