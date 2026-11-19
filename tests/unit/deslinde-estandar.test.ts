import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTIVIDADES } from "@/lib/operadores/actividades";
import {
  clausulasEstandar,
  DE_LA_10_A_LA_12,
  DE_LA_14_A_LA_16,
  DE_LA_1_A_LA_8,
  MENORES,
  OPCIONALES,
  POR_ACTIVIDAD,
  SEGURO,
  tieneDeslindeEstandar,
} from "@/lib/legal/clausulas-estandar";

// D28 · el deslinde estándar es texto de LEGAL: aquí sólo se comprueba que el
// código lo trae tal cual y que arma la lista con la variante que toca.

const legal = readFileSync("design/legal/DESLINDE-ESTANDAR-2026-11-19.md", "utf8").replace(/\n {2}> ?/g, " ").replace(/\n> ?/g, " ").replace(/\s+/g, " ");

describe("cada cláusula está tal cual en el documento de legal", () => {
  const todas: [string, string[]][] = [
    ["1 a 8", DE_LA_1_A_LA_8],
    ["9 · seguro", [SEGURO.con, SEGURO.sin]],
    ["10 a 12", DE_LA_10_A_LA_12],
    ["13 · menores", [MENORES.admite, MENORES.soloAdultos]],
    ["14 a 16", DE_LA_14_A_LA_16],
    ["opcionales", OPCIONALES],
    ...Object.entries(POR_ACTIVIDAD),
  ];
  for (const [nombre, textos] of todas) {
    it(nombre, () => {
      for (const t of textos) expect(legal).toContain(`«${t}»`);
    });
  }

  it("son 16 obligatorias y 2 opcionales, más las de la actividad", () => {
    expect(DE_LA_1_A_LA_8.length + 1 + DE_LA_10_A_LA_12.length + 1 + DE_LA_14_A_LA_16.length).toBe(16);
    expect(OPCIONALES).toHaveLength(2);
  });
});

describe("la lista de una experiencia nueva", () => {
  const de = (i: Partial<Parameters<typeof clausulasEstandar>[0]> = {}) => clausulasEstandar({ actividad: "senderismo", edadMinima: 12, conSeguro: true, ...i })!;
  const textos = (cs: { texto: string }[]) => cs.map((c) => c.texto);

  it("16 obligatorias + la de la actividad + 2 opcionales, todas de la casa", () => {
    const cs = de();
    expect(cs).toHaveLength(19);
    expect(cs.filter((c) => c.obligatoria)).toHaveLength(17);
    expect(cs.every((c) => c.origen === "casa")).toBe(true);
    expect(cs.slice(-2).map((c) => c.obligatoria)).toEqual([false, false]);
  });

  it("la aceptación cierra las obligatorias, y las de la actividad van con los riesgos", () => {
    const cs = de();
    const obligatorias = cs.filter((c) => c.obligatoria);
    expect(obligatorias.at(-1)?.texto).toBe(DE_LA_14_A_LA_16[2]);
    expect(cs[8].texto).toBe(POR_ACTIVIDAD.senderismo[0]);
  });

  it("el seguro dice la verdad: con póliza o sin ella, nunca las dos", () => {
    expect(textos(de({ conSeguro: true }))).toContain(SEGURO.con);
    expect(textos(de({ conSeguro: true }))).not.toContain(SEGURO.sin);
    expect(textos(de({ conSeguro: false }))).toContain(SEGURO.sin);
    expect(textos(de({ conSeguro: false }))).not.toContain(SEGURO.con);
  });

  it("menores: admite con tutor si la edad mínima es menor de 18; sólo adultos desde 18", () => {
    expect(textos(de({ edadMinima: 0 }))).toContain(MENORES.admite);
    expect(textos(de({ edadMinima: 17 }))).toContain(MENORES.admite);
    expect(textos(de({ edadMinima: 18 }))).toContain(MENORES.soloAdultos);
    expect(textos(de({ edadMinima: 18 }))).not.toContain(MENORES.admite);
  });

  it("buceo en cavernas lleva la de buceo más la suya", () => {
    const cs = textos(de({ actividad: "buceo-cavernas" }));
    expect(cs).toContain(POR_ACTIVIDAD.buceo[0]);
    expect(cs).toContain(POR_ACTIVIDAD["buceo-cavernas"][1]);
  });

  it("una actividad sin deslinde escrito por legal no tiene lista: nace apagado", () => {
    expect(clausulasEstandar({ actividad: "paracaidismo", edadMinima: 18, conSeguro: true })).toBeNull();
    expect(clausulasEstandar({ actividad: null, edadMinima: 18, conSeguro: true })).toBeNull();
  });
});

describe("qué actividades del catálogo ya tienen deslinde", () => {
  it("toda actividad con adicionales existe en el catálogo", () => {
    const catalogo = new Set(ACTIVIDADES.map((a) => a.slug));
    for (const slug of Object.keys(POR_ACTIVIDAD)) expect(catalogo.has(slug)).toBe(true);
  });

  it("las que faltan están declaradas aquí: si legal escribe una, esta lista se achica", () => {
    const faltan = ACTIVIDADES.map((a) => a.slug).filter((s) => !tieneDeslindeEstandar(s));
    expect(faltan.sort()).toEqual(["ciclismo-montana", "espeleismo", "observacion-naturaleza", "paracaidismo"]);
  });
});

import { buildDeslinde, renglonesDeQuienOrganiza, SECCIONES_GENERICAS, seccionesDelMarco2 } from "@/lib/legal/deslinde-doc";
import { experienciaDesdeCorta, type ExperienciaCorta } from "@/lib/experiences/corta";

describe("el marco corregido del documento (D28 §3)", () => {
  const titulos = (x: { titulo: string }[]) => x.map((s) => s.titulo);

  it("«Deslinde de responsabilidad» pasa a «Asunción de riesgos y responsabilidad», con el texto de legal", () => {
    const m = seccionesDelMarco2(true);
    expect(titulos(m)).toEqual(["Seguro y gastos médicos", "Asunción de riesgos y responsabilidad", "Uso de imagen", "Menores de edad (si aplica)", "Datos personales", "Aceptación"]);
    const asuncion = m[1].paras;
    for (const p of asuncion) expect(legal).toContain(p.replace(/^Con pleno/, "Con pleno"));
    expect(asuncion.join(" ")).not.toMatch(/negligencia grave/);
    expect(asuncion.join(" ")).toMatch(/no alcanza los daños causados por dolo, por negligencia de los guías o por el uso de equipo inadecuado/);
  });

  it("la sección de seguro sigue la variante: con póliza, el texto de legal; sin ella, el de hoy sin «enfáticamente»", () => {
    const con = seccionesDelMarco2(true)[0].paras;
    expect(con).toHaveLength(1);
    expect(legal).toContain(con[0]);
    const sin = seccionesDelMarco2(false)[0].paras;
    expect(sin).toHaveLength(SECCIONES_GENERICAS[0].paras.length);
    expect(sin.join(" ")).not.toMatch(/enfáticamente/);
    expect(sin[0]).toBe(SECCIONES_GENERICAS[0].paras[0]);
  });

  it("uso de imagen nombra al Organizador; el correo de derechos es el del aviso de privacidad", () => {
    const m = seccionesDelMarco2(false);
    expect(m[2].paras[0]).toContain("redes sociales del Organizador, Caminante y Numan");
    expect(m[4].paras[0]).toContain("Derechos ARCO: caminante@numanhub.com.");
  });

  it("el marco de siempre no cambió: las experiencias publicadas siguen firmando el mismo documento", () => {
    expect(titulos(SECCIONES_GENERICAS)).toEqual(["Seguro y gastos médicos", "Deslinde de responsabilidad", "Uso de imagen", "Menores de edad (si aplica)", "Datos personales", "Aceptación"]);
    expect(SECCIONES_GENERICAS[0].paras.join(" ")).toMatch(/enfáticamente/);
  });

  it("el encabezado nombra a quien vende (D22)", () => {
    expect(renglonesDeQuienOrganiza({ tipo: "casa" })).toEqual({ organiza: "NUMAN HUB, S.A. de C.V., bajo la marca Caminante (en adelante “el Organizador”).", operaEnCampo: null });
    expect(renglonesDeQuienOrganiza({ tipo: "operadora", nombre: "Operadora de Prueba, S.C.", rfc: "OPR200101AB1" })).toEqual({
      organiza: "Operadora de Prueba, S.C., RFC OPR200101AB1, a través de la plataforma Caminante, de NUMAN HUB, S.A. de C.V. (en adelante “el Organizador”).",
      operaEnCampo: null,
    });
    expect(renglonesDeQuienOrganiza({ tipo: "sin-convenio", nombre: "Operadora de Prueba" })).toMatchObject({ operaEnCampo: "Operadora de Prueba" });
  });
});

describe("una experiencia del alta rápida y su documento", () => {
  const corta: ExperienciaCorta = {
    titulo: "Amanecer en el Nevado",
    lugar: "Nevado de Toluca",
    estado: "Estado de México",
    actividad: "senderismo",
    descripcion: "Subimos de madrugada al cráter para ver salir el sol sobre las lagunas.",
    portada: "https://ejemplo.test/p.jpg",
    fotos: [],
    incluye: ["Guía"],
    noIncluye: [],
    horaInicio: "05:00",
    horaTermino: "13:00",
    exigencia: "media",
    edadMinima: "12",
    precio: "1850",
    cupo: "",
    politica: "estandar",
  };
  const documento = (conSeguro: boolean) =>
    buildDeslinde(experienciaDesdeCorta(corta, { conSeguro, clausulas: clausulasEstandar({ actividad: "senderismo", edadMinima: 12, conSeguro })! }))!;

  it("nace con el marco corregido", () => {
    expect(documento(true).marco).toBe(2);
    expect(documento(true).secciones.map((s) => s.titulo)).toContain("Asunción de riesgos y responsabilidad");
  });

  it("la lista y la sección de seguro dicen lo mismo, con póliza y sin ella", () => {
    const con = documento(true);
    expect(con.clausulas).toContain(SEGURO.con);
    expect(con.secciones[0].paras.join(" ")).toMatch(/cuenta con un seguro de accidentes/);
    const sin = documento(false);
    expect(sin.clausulas).toContain(SEGURO.sin);
    expect(sin.secciones[0].paras.join(" ")).toMatch(/NO proporciona seguro/);
  });

  it("una experiencia de antes (sin marca de marco) conserva el documento de siempre", () => {
    const vieja = experienciaDesdeCorta(corta, { clausulas: ["Participo de forma libre y voluntaria."] });
    delete vieja.registration!.marco;
    const doc = buildDeslinde(vieja)!;
    expect(doc.marco).toBeUndefined();
    expect(doc.secciones.map((s) => s.titulo)).toContain("Deslinde de responsabilidad");
  });
});
