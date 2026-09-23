// LOS CORREOS DE EMBAJADORES, POR LAS DOS COSAS QUE SÍ DUELEN.
//
// 1 · Que un párrafo se quede sólo en el HTML. Tres de estos cuatro correos lo
//     hacían, y en dos de ellos el párrafo perdido era el que importaba: el
//     cierre de la bienvenida («Tu comunidad ya quiere vivir esto. Tráela.») y
//     —peor— la línea de un RECHAZO que deja la puerta abierta.
//
// 2 · Que lo que alguien escriba en el formulario público se vuelva HTML en el
//     correo que lee la casa. Los cinco campos del aviso viajaban crudos.
//
// Se intercepta el envío: aquí no sale ningún correo, se mira lo que habría
// salido.
import { beforeEach, describe, expect, it, vi } from "vitest";

const enviados: { asunto: string; html: string; texto: string }[] = [];
vi.mock("@/lib/email/resend", () => ({
  sendViaResend: async (_to: string, subject: string, html: string, o: { text?: string }) => {
    enviados.push({ asunto: subject, html, texto: o?.text ?? "" });
    return true;
  },
}));

import {
  emailAvisoAdminAplicacion,
  emailBienvenidaEmbajador,
  emailConfirmacionAplicacion,
  emailRechazoAplicacion,
} from "@/lib/embajadores/emails";

const ultimo = () => enviados[enviados.length - 1];

beforeEach(() => {
  enviados.length = 0;
});

describe("nada se queda sólo en el HTML", () => {
  it("la bienvenida conserva su cierre en texto plano", async () => {
    await emailBienvenidaEmbajador("x@y.z", "Renata Paz");
    expect(ultimo().html).toContain("Tu comunidad ya quiere vivir esto");
    expect(ultimo().texto).toContain("Tu comunidad ya quiere vivir esto");
  });

  it("el rechazo conserva la línea que deja la puerta abierta", async () => {
    await emailRechazoAplicacion("x@y.z", "Renata Paz");
    // Es la razón de ser de un correo de rechazo amable: si sólo va en el HTML,
    // quien lee en texto plano recibe un «no» pelón.
    expect(ultimo().texto).toContain("las puertas de nuestras salidas están abiertas");
  });

  it("la confirmación conserva el enlace al sitio, legible", async () => {
    await emailConfirmacionAplicacion("x@y.z", "Renata Paz");
    // En texto plano la liga se lee como dominio, no como una etiqueta <a>.
    expect(ultimo().texto).toContain("caminante.numanhub.com");
    expect(ultimo().texto).not.toContain("<a href");
  });

  // Sin nombre no hay coma. Antes el respaldo era un saludo metido en el hueco
  // del nombre y salía a media frase: «Recibimos tu aplicación, caminante.»
  it("sin nombre, la frase cierra sola: ni coma ni saludo de relleno", async () => {
    await emailConfirmacionAplicacion("x@y.z", null);
    expect(ultimo().texto).toContain("Recibimos tu aplicación.");
    expect(ultimo().texto).not.toContain("caminante.\n");
  });

  it("con nombre, la coma y el nombre de pila", async () => {
    await emailConfirmacionAplicacion("x@y.z", "renata de la paz");
    expect(ultimo().texto).toContain("Recibimos tu aplicación, Renata.");
  });
});

describe("lo que se escribe en el formulario público no se vuelve HTML", () => {
  const conNombre = (nombre: string) =>
    emailAvisoAdminAplicacion({
      nombre,
      email: "renata@x.mx",
      whatsapp: null,
      perfil: "Montaña & trail",
      links: "@renata",
    });

  it("una etiqueta escrita en el nombre se lee, no se ejecuta", async () => {
    await conNombre('Renata <img src=x onerror="alert(1)"> Paz');
    expect(ultimo().html).not.toContain("<img src=x");
    expect(ultimo().html).toContain("&lt;img src=x");
    // Y en texto plano se lee tal cual la escribió: no se pierde el dato.
    expect(ultimo().texto).toContain('Renata <img src=x onerror="alert(1)"> Paz');
  });

  it("un ampersand no rompe el renglón", async () => {
    await conNombre("Renata Paz");
    expect(ultimo().html).toContain("Montaña &amp; trail");
    expect(ultimo().texto).toContain("Perfil: Montaña & trail");
  });

  it("los cinco campos llegan al texto, y el «—» del WhatsApp vacío también", async () => {
    await conNombre("Renata Paz");
    for (const campo of ["Nombre:", "Correo:", "WhatsApp: —", "Perfil:", "Redes:"]) {
      expect(ultimo().texto).toContain(campo);
    }
  });
});
