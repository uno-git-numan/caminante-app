// EL MARCO DE LOS CORREOS INTERNOS — uno solo, para operadores y embajadores.
//
// ⚠️ ESTABA COPIADO EN DOS MÓDULOS. `lib/operadores/emails.ts` y
// `lib/embajadores/emails.ts` traían cada uno su propia versión del mismo
// cascarón: idénticos salvo el rótulo del encabezado. Dos copias del mismo
// marco significan que cada lección se aprende dos veces — y ese fue
// literalmente el caso: el 23 sep 2026 se arregló en uno la divergencia entre
// el HTML y el texto plano, y el otro se quedó con el bug intacto.
//
// El marco viene del correo de confirmación de compra (`notify-customer`), que
// sobrevivió Gmail y Apple Mail de verdad: el remitente «Luis · Caminante» que
// saca los correos de Promociones, el sello a 4× para que no se vea desvaído y
// el aplanado de tablas que arregló el corte en iPhone. Esas lecciones fueron
// caras; se conservan tal cual.
//
// ⚠️ ESTO NO ES EL SISTEMA DE CORREO DEL CLIENTE. El boletín tiene sus propias
// plantillas de Claude Design (`lib/newsletter/templates.ts`) y la confirmación
// de compra viste la marca del operador. Aquí viven los correos INTERNOS del
// funnel —operadoras y embajadores—, que hablan con la voz de la casa.

/**
 * UN BLOQUE DEL CORREO, EN SUS DOS IDIOMAS A LA VEZ.
 *
 * ⚠️ NACIÓ DE UN BUG MEDIDO, dos veces. Cada correo se escribía duplicado —el
 * HTML y, aparte y a mano, el `text` de respaldo— y las copias llevaban meses
 * separándose: párrafos enteros que sólo veía quien abre HTML, y —lo peor— el
 * mensaje escrito a mano por la casa que no viajaba al texto plano, así que
 * quien lo leyera ahí recibía un correo distinto con el mismo asunto.
 *
 * Nadie lo notó porque el texto plano no se ve al mandarlo: lo leen los
 * clientes que no pintan HTML, los lectores de pantalla y el filtro de spam.
 * Un respaldo que nadie mira es un respaldo que se pudre.
 *
 * Desde aquí hay UN solo texto y el plano se DERIVA de él. No se puede escribir
 * uno sin el otro, que es la única forma de que no vuelvan a separarse.
 */
export type Bloque = { html: string; texto: string };

export const CREMA = "#fbfbf7";
export const LAGOON = "#3e4836";
export const ARENA = "#d4cec6";
export const OLIVO = "#776f67";
export const NARANJA = "#ff5d36";

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * El HTML de un bloque, en plano.
 *
 * ⚠️ EL ORDEN NO ES CASUAL: primero se quitan las etiquetas y DESPUÉS se
 * desescapa. Al revés, un «&lt;b&gt;» que alguien escribió a mano se
 * convertiría en etiqueta de verdad y el desetiquetado se comería justo el
 * texto que esa persona quería que se leyera.
 */
export const aTexto = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

/**
 * EL NOMBRE DE PILA CON SU COMA — O NADA.
 *
 * Los trece encabezados de estos dos funnels terminan igual: «Recibimos tu
 * solicitud, Renata.» Sin nombre, el respaldo era un saludo metido en el hueco
 * del nombre, y salía a media frase: «Recibimos tu solicitud, hola.» en
 * operadoras y «Recibimos tu aplicación, caminante.» en embajadores. Es de esas
 * cosas que se leen como un error de máquina justo en el primer correo que
 * alguien recibe de nosotros.
 *
 * Sin nombre no hay coma: «Recibimos tu solicitud.» Una frase completa dice
 * menos, pero no dice nada raro.
 *
 * ⚠️ Y VA ESCAPADO. El nombre sale de un formulario público —`responsable` en
 * la solicitud de operadora, `nombre` en la de embajador— y se interpolaba
 * crudo en el `<h1>`. Es el mismo agujero que tenían los cinco campos del aviso
 * al admin, en el encabezado esta vez.
 */
export function saludo(nombre: string | null | undefined): string {
  const pila = (nombre ?? "").trim().split(/\s+/)[0] ?? "";
  if (!pila) return "";
  return `, ${esc(pila.charAt(0).toUpperCase() + pila.slice(1).toLowerCase())}`;
}

export const p = (t: string): Bloque => ({
  html: `<tr><td style="padding:0 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><p style="margin:0 0 10px;font-size:16px;line-height:1.6;color:${LAGOON};">${t}</p></td></tr>`,
  texto: aTexto(t),
});

export const h1 = (t: string): Bloque => ({
  html: `<tr><td style="padding:16px 36px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"><h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${LAGOON};font-weight:600;">${t}</h1></td></tr>`,
  texto: aTexto(t),
});

/** Botón grande. Debajo SIEMPRE va la liga en texto plano: si el botón no carga
 *  —cliente que bloquea estilos, modo texto— el correo sigue sirviendo. */
export const boton = (texto: string, url: string): Bloque => ({
  html: `<tr><td style="padding:10px 36px 4px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<a href="${url}" style="display:inline-block;background:${NARANJA};color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 26px;border-radius:999px;">${texto}</a>
</td></tr>
<tr><td style="padding:6px 36px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;line-height:1.6;color:${OLIVO};word-break:break-all;">O copia esta liga: ${url}</div></td></tr>`,
  texto: `${texto}:\n${url}`,
});

/**
 * Un bloque con HTML propio —una tabla de datos, un botón con otro color— que
 * no cabe en los de arriba.
 *
 * ⚠️ PIDE SU TEXTO A LA FUERZA, y por eso es un parámetro y no algo derivado:
 * de una tabla no sale una frase legible sola. Obligar a escribirlo es lo que
 * impide que un bloque a la medida se vuelva el agujero por donde vuelve la
 * divergencia.
 */
export const crudo = (html: string, texto: string): Bloque => ({ html, texto });

/** Varios párrafos a partir de un mensaje escrito a mano. */
export const parrafosDe = (mensaje: string): Bloque[] =>
  mensaje
    .trim()
    .split(/\n{2,}/)
    .map((t) => p(esc(t).replace(/\n/g, "<br>")));

/**
 * Arma el correo entero.
 *
 * `rotulo` es lo ÚNICO que cambia entre los dos funnels: «Operadores» o
 * «Programa de embajadores». Cuando eso era una copia del marco completo, la
 * diferencia de una línea costaba un archivo entero de mantenimiento.
 */
export function marco(rotulo: string, bloques: Bloque[]): { html: string; texto: string } {
  const inner = bloques.map((b) => b.html).join("");
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${ARENA};border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;letter-spacing:3px;color:${OLIVO};text-transform:uppercase;">Caminante &middot; ${rotulo}</div></td></tr>
${inner}
<tr><td style="padding:14px 36px 30px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="border-top:1px solid ${ARENA};padding-top:18px;font-size:13px;line-height:1.6;color:${OLIVO};">¿Dudas? Responde este correo y te contestamos.</div></td></tr>
</table>
<div style="max-width:540px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${OLIVO};padding:18px 8px;">Caminante by NUMAN &middot; uno@numanhub.com</div>
</td></tr></table></body></html>`;
  // El pie va en los dos, igual que en el marco: quien lee en texto plano
  // también tiene que saber a quién le está contestando.
  const texto =
    bloques.map((b) => b.texto).filter(Boolean).join("\n\n") +
    "\n\n¿Dudas? Responde este correo y te contestamos.\n\nCaminante by NUMAN · uno@numanhub.com";
  return { html, texto };
}
