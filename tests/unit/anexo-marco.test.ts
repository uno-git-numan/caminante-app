// EL MARCO DEL ANEXO POR ACTIVIDAD ES TEXTO DE LEGAL (D30, 23 nov 2026).
//
// Código genera las dos listas del catálogo; el texto fijo —once cláusulas—
// lo escribió la sesión legal en
// `design/legal/ANEXO-ACTIVIDAD-MARCO-v3-2026-11-23.md`. Esta prueba compara lo
// que la operadora firma contra ese archivo, palabra por palabra, y la
// clasificación de cada documento contra su lista.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTIVIDADES, momentoDePropio, nombreDeActividad, requisitosDe } from "@/lib/operadores/actividades";
import {
  MARCO_ANEXO,
  SIN_DOCUMENTOS,
  listaDeDeclarados,
  listaDeEntrega,
  normaDelAnexo,
  textoDelAnexo,
  versionDelAnexo,
} from "@/lib/operadores/subconvenio-doc";

const md = readFileSync("design/legal/ANEXO-ACTIVIDAD-MARCO-v3-2026-11-23.md", "utf8");
const plano = (s: string) => s.replace(/\s+/g, " ").trim();

/** El marco tal como lo escribió legal: las líneas citadas de la sección 2. */
const marcoDeLegal = (): string => {
  const desde = md.indexOf("> # Anexo por actividad — {nombre}");
  const hasta = md.indexOf("**Lo que cambió respecto del marco v2");
  return md
    .slice(desde, hasta)
    .split("\n")
    .map((l) => l.replace(/^>\s?/, ""))
    .join("\n");
};

describe("el marco v3 del anexo es el de legal", () => {
  it("es la versión v3", () => {
    expect(MARCO_ANEXO).toBe("v3");
  });

  it.each(ACTIVIDADES.map((a) => a.slug))("%s: el texto que se firma es el de legal, con sus listas", (slug) => {
    const req = requisitosDe(slug);
    const nombre = nombreDeActividad(slug);
    const esperado = marcoDeLegal()
      .replace("{nombre}", nombre)
      .replace("{nombre}", nombre.toLowerCase())
      .replace("{norma}", normaDelAnexo(slug))
      .replace("{lista_entregan}", listaDeEntrega(req.propios))
      .replace("{lista_declaran}", listaDeDeclarados(req.declarados));
    expect(plano(textoDelAnexo(slug)!)).toBe(plano(esperado));
  });

  it("las listas llevan la frase de vigencia que pidió legal, y la de «sin documentos» cuando están vacías", () => {
    const req = requisitosDe("senderismo");
    expect(listaDeEntrega(req.propios)).toContain("Debe estar vigente el día de cada salida; se entrega con su fecha de vencimiento.");
    expect(listaDeDeclarados(req.declarados)).not.toContain("vigente");
    expect(listaDeEntrega([])).toBe(SIN_DOCUMENTOS);
    expect(md).toContain(`«${SIN_DOCUMENTOS}»`);
  });

  it("pasar un documento de una lista a la otra cambia la versión del anexo", () => {
    for (const a of ACTIVIDADES) expect(versionDelAnexo(a.slug)).toMatch(/^v3\./);
  });
});

describe("la clasificación de cada documento es la de legal (D30 §1)", () => {
  // Las dos tablas de «Lista completa»: los slugs entre comillas invertidas.
  const tabla = (titulo: string): string[] => {
    const i = md.indexOf(titulo);
    const fin = md.indexOf("\n\n", i);
    return [...md.slice(i, fin).matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
  };
  const entregan = tabla("| Se entregan antes de la primera salida | Inciso |");
  const declaran = tabla("| Se declaran en el anexo |");

  it("legal listó los dos grupos", () => {
    expect(entregan.length).toBeGreaterThan(15);
    expect(declaran.length).toBeGreaterThan(25);
  });

  it("lo que legal dice que se entrega, se entrega; lo que dice que se declara, se declara", () => {
    for (const s of entregan) expect(momentoDePropio(s), s).toBe("salida");
    for (const s of declaran) expect(momentoDePropio(s), s).toBe("declarado");
  });

  it("no hay un documento del catálogo que legal no haya clasificado", () => {
    const clasificados = new Set([...entregan, ...declaran]);
    const sueltos = ACTIVIDADES.flatMap((a) => a.documentos.map((d) => d.slug)).filter(
      (s) => !s.startsWith("nom09-") && !clasificados.has(s),
    );
    expect(sueltos).toEqual([]);
  });
});
