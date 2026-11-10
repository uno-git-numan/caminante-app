// LOS DATOS FISCALES SALEN DE LA CONSTANCIA (fiscal-de-csf.ts). Luis, 9 nov
// 2026: «que salgan de la constancia y no pidamos». Sólo de una que el SAT
// confirmó, nunca completando lo que falte, y sin pisar un RFC distinto.
import { describe, expect, it } from "vitest";
import type { AnalisisCsf } from "@/lib/operadores/csf";
import { cambiosFiscales, claveDeRegimen, datosFiscalesDeCsf } from "@/lib/operadores/fiscal-de-csf";

const fisica: AnalisisCsf = {
  v: 1, at: "2026-11-09T00:00:00Z", esConstancia: true, rfc: "ROBL990531HI3", nombre: "LAURA ROBLES",
  fechaEmision: "2026-11-01", codigoPostal: "06700",
  regimenes: ["Régimen de las Personas Físicas con Actividades Empresariales y Profesionales"],
  estatus: "ACTIVO", alertas: [], sat: "validada", satUrl: "u", coincideRfc: null, diasDeAntiguedad: 8,
};

describe("claveDeRegimen", () => {
  it("lee el nombre como lo escribe la constancia, con o sin acentos", () => {
    expect(claveDeRegimen("Régimen de las Personas Físicas con Actividades Empresariales y Profesionales")).toBe("612");
    expect(claveDeRegimen("Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas")).toBe("625");
    expect(claveDeRegimen("Régimen Simplificado de Confianza")).toBe("626");
    expect(claveDeRegimen("Régimen General de Ley Personas Morales")).toBe("601");
    expect(claveDeRegimen("Regimen de Sueldos y Salarios e Ingresos Asimilados a Salarios")).toBe("605");
  });
  it("si trae la clave, la clave manda", () => {
    expect(claveDeRegimen("626 - Simplificado")).toBe("626");
  });
  it("lo que no reconoce queda en null: no se adivina", () => {
    expect(claveDeRegimen("Régimen inventado")).toBeNull();
  });
});

describe("datosFiscalesDeCsf", () => {
  it("constancia confirmada con un régimen de negocio ⇒ los cuatro datos y el régimen", () => {
    const r = datosFiscalesDeCsf(fisica);
    expect(r).toEqual({
      ok: true,
      datos: { rfc: "ROBL990531HI3", razonSocial: "LAURA ROBLES", cp: "06700", tipoPersona: "fisica", regimenes: ["612"], regimen: "612" },
    });
  });

  it("física o moral la dice el RFC: 12 caracteres es moral", () => {
    const r = datosFiscalesDeCsf({ ...fisica, rfc: "NHU250826CS8", nombre: "NUMAN HUB", regimenes: ["Régimen General de Ley Personas Morales"] });
    expect(r.ok && r.datos.tipoPersona).toBe("moral");
    expect(r.ok && r.datos.regimen).toBe("601");
  });

  it("sueldos y salarios no es con lo que opera: no cuenta para facturar la comisión", () => {
    const r = datosFiscalesDeCsf({
      ...fisica,
      regimenes: ["Régimen de Sueldos y Salarios e Ingresos Asimilados a Salarios", "Régimen Simplificado de Confianza"],
    });
    expect(r.ok && r.datos.regimen).toBe("626");
  });

  it("dos regímenes de negocio ⇒ el régimen queda sin decidir (pregunta abierta a la sesión fiscal)", () => {
    const r = datosFiscalesDeCsf({
      ...fisica,
      regimenes: [
        "Régimen de las Personas Físicas con Actividades Empresariales y Profesionales",
        "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
      ],
    });
    expect(r.ok && r.datos.regimenes).toEqual(["612", "625"]);
    expect(r.ok && r.datos.regimen).toBeNull();
  });

  it("sin el SAT confirmándola no se toma nada, aunque la lectura se vea perfecta", () => {
    for (const sat of ["no_emitida", "sin_respuesta", "sin_datos"] as const) {
      expect(datosFiscalesDeCsf({ ...fisica, sat }).ok).toBe(false);
    }
  });

  it("un contribuyente que el SAT no tiene activo no se da por bueno", () => {
    const r = datosFiscalesDeCsf({ ...fisica, estatus: "SUSPENDIDO" });
    expect(r.ok).toBe(false);
  });

  it("si falta un dato, no se completa", () => {
    expect(datosFiscalesDeCsf({ ...fisica, codigoPostal: null }).ok).toBe(false);
    expect(datosFiscalesDeCsf({ ...fisica, nombre: null }).ok).toBe(false);
    expect(datosFiscalesDeCsf(null).ok).toBe(false);
  });
});

describe("cambiosFiscales", () => {
  const d = (datosFiscalesDeCsf(fisica) as { ok: true; datos: Parameters<typeof cambiosFiscales>[0] }).datos;

  it("sin RFC previo escribe los cinco campos", () => {
    expect(cambiosFiscales(d, { rfc: null, tipo_persona: null })).toEqual({
      escribir: { rfc: "ROBL990531HI3", razon_social: "LAURA ROBLES", cp_fiscal: "06700", tipo_persona: "fisica", regimen_fiscal: "612" },
      motivo: null,
    });
  });

  it("el RFC confirmado por el SAT corrige el botón de física o moral", () => {
    expect(cambiosFiscales(d, { rfc: null, tipo_persona: "moral" }).escribir.tipo_persona).toBe("fisica");
  });

  it("con OTRO RFC ya capturado no toca nada: puede ser la constancia de otra persona", () => {
    const r = cambiosFiscales(d, { rfc: "XAXX010101000", tipo_persona: "fisica" });
    expect(r.escribir).toEqual({});
    expect(r.motivo).toMatch(/ROBL990531HI3/);
  });

  it("con dos regímenes no borra el que ya estaba", () => {
    const r = cambiosFiscales({ ...d, regimen: null }, { rfc: d.rfc, tipo_persona: "fisica" });
    expect(r.escribir).not.toHaveProperty("regimen_fiscal");
  });
});
