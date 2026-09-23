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
import { aTexto, fraseDelDinero, fraseDeVigencia } from "@/lib/operadores/emails";

describe("dónde está el dinero de la primera venta", () => {
  it("con Connect: es suyo, y se dice cuánto retuvimos", () => {
    const f = fraseDelDinero(1750, 350);
    expect(f).toContain("a tu cuenta de Stripe");
    expect(f).toContain("$350.00");
    expect(f).toContain("$1,750.00");
    expect(f).not.toContain("transferimos");
  });

  it("por la casa: NO es suyo todavía, y no se le dice que sí", () => {
    const f = fraseDelDinero(1750, null);
    expect(f).toContain("transferimos");
    // La afirmación que importa. Decirle «entró a tu cuenta» cuando el dinero
    // está en la de Numan es la mentira que se descubre cuando va a buscarlo.
    expect(f).not.toContain("tu cuenta de Stripe");
    expect(f).not.toContain("retuvo");
  });

  it("los pesos llevan separador de miles y dos decimales", () => {
    expect(fraseDelDinero(21000, null)).toContain("$21,000.00");
    expect(fraseDelDinero(1750, 301.72)).toContain("$301.72");
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

// La regla que hace imposible la divergencia, no sólo improbable: el texto
// plano SE DERIVA del HTML. Antes se escribía a mano y por eso la invitación a
// la llamada mandaba el mensaje personalizado por un camino y el genérico por
// el otro.
describe("el texto plano se saca del HTML, no se escribe aparte", () => {
  it("quita etiquetas y devuelve las entidades", () => {
    expect(aTexto("Hola <b>Ana</b>")).toBe("Hola Ana");
    expect(aTexto("Corral &amp; Piedra")).toBe("Corral & Piedra");
    expect(aTexto("Caminante &middot; Operadores")).toBe("Caminante · Operadores");
  });

  it("un <br> es un renglón, no una palabra pegada", () => {
    expect(aTexto("una<br>otra")).toBe("una\notra");
    expect(aTexto("una<br />otra")).toBe("una\notra");
  });

  it("el nombre que alguien escribió con < > sobrevive el viaje completo", () => {
    // Lo que llega a `p()` ya pasó por `esc()`. Se desescapa al derivar, así que
    // lo que la persona escribió es lo que lee quien abre en texto plano.
    const comoLoPinta = "Opera &lt;Montaña&gt; &amp; Cía"; // esc("Opera <Montaña> & Cía")
    expect(aTexto(comoLoPinta)).toBe("Opera <Montaña> & Cía");
  });

  // ⚠️ EL ORDEN NO ES CASUAL: primero se quitan las etiquetas y DESPUÉS se
  // desescapa. Al revés, un «&lt;b&gt;» que alguien escribió a mano se
  // convertiría en una etiqueta de verdad y el desetiquetado se lo comería —
  // justo el texto que esa persona quería que se leyera.
  it("un <b> escrito a mano se lee, no se borra", () => {
    expect(aTexto("dice &lt;b&gt;así&lt;/b&gt; textual")).toBe("dice <b>así</b> textual");
  });
});
