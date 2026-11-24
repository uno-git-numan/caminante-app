// LA MARCA EN LA PÁGINA DE UNA EXPERIENCIA (23 nov 2026). Luis: «Acá no se ve
// el logo de su marca, se ve nuestro logo». Qué se pinta y cuándo.
import { describe, expect, it } from "vitest";
import { marcaDePagina } from "@/lib/operators/marca";
import type { OperatorBranding } from "@/lib/operators/branding";

const colors = { primary: "#1f4e8c", accent: "#6b7280" };
// La marca puede estar A MEDIAS en la base (logo sin colores, o al revés): el
// tipo pide todo, la realidad no. Las pruebas usan la realidad.
const b = (x: object) => x as OperatorBranding;

describe("la marca en la página de una experiencia", () => {
  it("sin operadora, o sin logo y sin colores, la página es de Caminante", () => {
    expect(marcaDePagina(null)).toBeNull();
    expect(marcaDePagina({ name: "Nomádika", branding: null })).toBeNull();
    expect(marcaDePagina({ name: "Nomádika", branding: b({ colors: { primary: "#1f4e8c" } }) })).toBeNull();
  });

  it("con sus dos logos, cada uno va en su fondo", () => {
    const m = marcaDePagina({
      name: "Operadora de Prueba",
      branding: b({ logoUrl: "https://x.test/logo.png", logoDarkUrl: "https://x.test/logo-blanco.png", colors, footerLine: "Montaña en serio" }),
    })!;
    expect(m).toMatchObject({
      nombre: "Operadora de Prueba",
      logoClaro: "https://x.test/logo.png",
      logoOscuro: "https://x.test/logo-blanco.png",
      pie: "Montaña en serio",
      poweredBy: "discreto",
    });
  });

  it("con un solo logo, ése va en los dos fondos: antes su logo que el nombre de otra marca", () => {
    const m = marcaDePagina({ name: "Kéntro", branding: b({ logoUrl: "https://x.test/kentro.svg" }) })!;
    expect(m.logoClaro).toBe("https://x.test/kentro.svg");
    expect(m.logoOscuro).toBe("https://x.test/kentro.svg");
  });

  it("con colores y sin logo va su nombre en texto, como promete el formulario de marca", () => {
    const m = marcaDePagina({ name: "Operadora de Prueba", branding: b({ colors }) })!;
    expect(m.logoClaro).toBeNull();
    expect(m.logoOscuro).toBeNull();
    expect(m.nombre).toBe("Operadora de Prueba");
  });

  it("un logo que no es una imagen por https no se pinta", () => {
    expect(marcaDePagina({ name: "X", branding: b({ logoUrl: "0-logo-PRUEBA.png" }) })).toBeNull();
    expect(marcaDePagina({ name: "X", branding: b({ logoUrl: "javascript:alert(1)", colors }) })!.logoClaro).toBeNull();
  });

  it("«Operado con Caminante» es discreto salvo que la operadora lo quiera visible", () => {
    expect(marcaDePagina({ name: "X", branding: b({ colors, poweredBy: "visible" }) })!.poweredBy).toBe("visible");
  });
});
