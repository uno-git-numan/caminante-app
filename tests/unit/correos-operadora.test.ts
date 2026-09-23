// LAS DOS FRASES QUE NO PUEDEN SALIR MAL.
//
// El resto de un correo es copy: si queda torcido, se lee raro y se arregla.
// Estas dos no. Una dice DÓNDE ESTÁ EL DINERO de una operadora y la otra dice
// DESDE CUÁNDO no puede vender. Equivocarlas no se lee raro: se cree, se actúa
// en consecuencia, y el error aparece cuando alguien va a buscar su dinero o
// descubre que lleva una semana sin poder publicar.
//
// Por eso viven fuera de las plantillas y por eso tienen prueba.
import { describe, expect, it } from "vitest";
import { fraseDelDinero, fraseDeVigencia } from "@/lib/operadores/emails";

describe("dónde está el dinero de la primera venta", () => {
  it("con Connect: es suyo, y se dice cuánto retuvimos", () => {
    const f = fraseDelDinero(1750, 350);
    expect(f.html).toContain("a tu cuenta de Stripe");
    expect(f.html).toContain("$350.00");
    expect(f.html).toContain("$1,750.00");
    expect(f.html).not.toContain("transferimos");
  });

  it("por la casa: NO es suyo todavía, y no se le dice que sí", () => {
    const f = fraseDelDinero(1750, null);
    expect(f.texto).toContain("transferimos");
    // La afirmación que importa. Decirle «entró a tu cuenta» cuando el dinero
    // está en la de Numan es la mentira que se descubre cuando va a buscarlo.
    expect(f.texto).not.toContain("tu cuenta de Stripe");
    expect(f.html).not.toContain("retuvo");
  });

  it("las dos versiones dicen lo mismo: el HTML es el texto con negritas", () => {
    for (const retenido of [350, null]) {
      const f = fraseDelDinero(1750, retenido);
      expect(f.html.replace(/<\/?b>/g, "")).toBe(f.texto);
    }
  });

  it("los pesos llevan separador de miles y dos decimales", () => {
    expect(fraseDelDinero(21000, null).texto).toContain("$21,000.00");
    expect(fraseDelDinero(1750, 301.72).texto).toContain("$301.72");
  });
});

describe("desde cuándo aplica el convenio", () => {
  it("vigente hoy: se dice que sin firma no se vende", () => {
    expect(fraseDeVigencia(0)).toContain("no pueden publicarse ni cobrar");
  });

  it("todavía no: NO se asusta, y se dicen los días", () => {
    const f = fraseDeVigencia(30);
    expect(f).toContain("30 días");
    expect(f).toContain("sigues vendiendo normal");
    expect(f).not.toContain("no pueden publicarse");
  });

  it("un día es «día», no «días»", () => {
    expect(fraseDeVigencia(1)).toContain("en 1 día.");
  });

  // Un número negativo sale de restarle a una fecha ya pasada. Tratarlo como
  // «faltan -3 días» sería absurdo; ya venció es ya venció.
  it("una fecha que ya pasó se lee como vigente, no como «faltan -3 días»", () => {
    expect(fraseDeVigencia(-3)).toBe(fraseDeVigencia(0));
  });
});
