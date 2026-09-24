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
import { aTexto, marco, p, saludo } from "@/lib/email/plantilla";

describe("dónde está el dinero de la primera venta", () => {
  it("con Connect: es suyo, y se dice cuánto retuvimos", () => {
    const f = fraseDelDinero(1750, 350);
    expect(f).toContain("a tu cuenta de cobro");
    expect(f).toContain("$350.00");
    expect(f).toContain("$1,750.00");
    expect(f).not.toContain("transferimos");
  });

  it("por la casa: NO es suyo todavía, y no se le dice que sí", () => {
    const f = fraseDelDinero(1750, null);
    expect(f).toContain("transferimos");
    // La afirmación que importa. Decirle «entró a tu cuenta» cuando el dinero
    // está en la de Numan es la mentira que se descubre cuando va a buscarlo.
    expect(f).not.toContain("tu cuenta de cobro");
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

// La regla del marco compartido: si un bloque está en el HTML, está en el texto.
// Es lo que impedía que la bienvenida de embajadores perdiera su última línea
// («Tu comunidad ya quiere vivir esto. Tráela.») sólo para quien lee en plano.
describe("el marco no deja caer bloques", () => {
  it("cada párrafo del HTML aparece en el texto", () => {
    const lineas = ["Primero.", "Segundo.", "Y el tercero, que es el que se perdía."];
    const c = marco("Operadores", lineas.map((t) => p(t)));
    for (const l of lineas) {
      expect(c.html).toContain(l);
      expect(c.texto).toContain(l);
    }
  });

  it("el pie va en los dos: quien lee en plano también sabe a quién contesta", () => {
    const c = marco("Programa de embajadores", [p("hola")]);
    expect(c.texto).toContain("Responde este correo");
    expect(c.texto).toContain("uno@numanhub.com");
  });

  it("el rótulo es lo único que cambia entre los dos funnels", () => {
    const a = marco("Operadores", [p("x")]).html;
    const b = marco("Programa de embajadores", [p("x")]).html;
    expect(a.replace("Caminante &middot; Operadores", "@@")).toBe(
      b.replace("Caminante &middot; Programa de embajadores", "@@"),
    );
  });
});

// El saludo por omisión: un respaldo que sale a media frase se lee como un
// error de máquina justo en el primer correo que alguien recibe de nosotros.
describe("el nombre de pila del encabezado", () => {
  it("sin nombre no hay coma: la frase cierra sola", () => {
    for (const vacio of [null, undefined, "", "   "]) {
      expect(saludo(vacio)).toBe("");
    }
  });

  it("con nombre completo, sólo el de pila y capitalizado", () => {
    expect(saludo("renata de la paz")).toBe(", Renata");
    expect(saludo("  ADRIANA  RUIZ ")).toBe(", Adriana");
  });

  // El nombre sale de un formulario público y se interpolaba CRUDO en el <h1>.
  it("un nombre con etiquetas no se vuelve HTML", () => {
    expect(saludo("<b>Ana")).toBe(", &lt;b&gt;ana");
  });

  it("así se lee el encabezado, con y sin nombre", () => {
    expect(`Recibimos tu solicitud${saludo("Renata Paz")}.`).toBe("Recibimos tu solicitud, Renata.");
    expect(`Recibimos tu solicitud${saludo(null)}.`).toBe("Recibimos tu solicitud.");
  });
});
