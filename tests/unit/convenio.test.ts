// LAS REGLAS DEL CONVENIO — qué versión se exige hoy, cuánto plazo hay, y a
// quién le toca el pendiente. El módulo abre Supabase para leer versiones; aquí
// se simula ese cliente y se prueban las reglas puras.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => {
    throw new Error("las reglas del convenio no deben tocar la base");
  },
}));

import {
  DIAS_DE_AVISO,
  convenioAlDia,
  diasParaFirmar,
  hashDeTexto,
  leerEstado,
  type VersionConvenio,
} from "@/lib/operadores/convenio";

const v = (p: Partial<VersionConvenio> & { version: string; orden: number; tipo: "mayor" | "menor" }): VersionConvenio => ({
  titulo: "Convenio",
  texto: "texto " + p.version,
  hash: "h",
  vigenteDesde: "2026-01-01T00:00:00Z",
  publicadaAt: "2026-01-01T00:00:00Z",
  ...p,
});

const HOY = new Date("2026-09-22T12:00:00Z");

describe("leerEstado", () => {
  it("sin versiones publicadas no se exige nada", () => {
    expect(leerEstado([], HOY)).toEqual({ exigida: null, ultima: null, porVenir: null });
  });

  it("una MAYOR ya vigente se exige; una menor sólo se muestra", () => {
    const versiones = [v({ version: "v1.1", orden: 2, tipo: "menor" }), v({ version: "v1", orden: 1, tipo: "mayor" })];
    const e = leerEstado(versiones, HOY);
    expect(e.exigida?.version).toBe("v1");
    expect(e.ultima?.version).toBe("v1.1");
    expect(e.porVenir).toBeNull();
  });

  it("una MAYOR con vigencia futura avisa sin bloquear: sigue exigida la anterior", () => {
    const versiones = [
      v({ version: "v2", orden: 3, tipo: "mayor", vigenteDesde: "2026-10-15T00:00:00Z" }),
      v({ version: "v1", orden: 1, tipo: "mayor" }),
    ];
    const e = leerEstado(versiones, HOY);
    expect(e.exigida?.version).toBe("v1");
    expect(e.porVenir?.version).toBe("v2");
    expect(diasParaFirmar(e.porVenir!, HOY)).toBe(23);
  });
});

describe("convenioAlDia", () => {
  const v1 = v({ version: "v1", orden: 1, tipo: "mayor" });
  const v2 = v({ version: "v2", orden: 2, tipo: "mayor", vigenteDesde: "2026-09-01T00:00:00Z" });

  it("si la casa no ha publicado nada, el pendiente es DE LA CASA", () => {
    const r = convenioAlDia(leerEstado([], HOY), null, []);
    expect(r).toEqual({ alDia: false, toca: "casa", detalle: "La casa no ha publicado el convenio" });
  });

  it("sin firma: le toca a la operadora", () => {
    const r = convenioAlDia(leerEstado([v1], HOY), null, [v1]);
    expect(r.alDia).toBe(false);
    expect(r.toca).toBe("operadora");
  });

  it("firmar la exigida o algo más nuevo cubre", () => {
    expect(convenioAlDia(leerEstado([v1], HOY), "v1", [v1]).alDia).toBe(true);
    expect(convenioAlDia(leerEstado([v2, v1], HOY), "v2", [v2, v1]).alDia).toBe(true);
  });

  it("firmar una versión vieja cuando ya se exige una nueva NO cubre, y lo dice", () => {
    const r = convenioAlDia(leerEstado([v2, v1], HOY), "v1", [v2, v1]);
    expect(r.alDia).toBe(false);
    expect(r.detalle).toBe("Firmó v1; se exige v2");
  });
});

describe("hashDeTexto", () => {
  it("es el sha-256 del texto exacto: un espacio cambia la firma", () => {
    expect(hashDeTexto("a")).toBe("ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb");
    expect(hashDeTexto("a ")).not.toBe(hashDeTexto("a"));
  });

  it("el aviso de un cambio mayor es de 30 días", () => {
    expect(DIAS_DE_AVISO).toBe(30);
  });
});
