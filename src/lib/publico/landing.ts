// El landing de escritorio (`public/landing/index.html`), servido desde la ruta
// React `/caminante` en vez de por un rewrite de `next.config.ts`.
//
// ⚠️ POR QUÉ ESTO EXISTE. `/caminante` tiene que servir DOS marcados: el
// escritorio de siempre y la vista móvil nueva (`PubInicio`). El patrón del
// sitio público móvil (design/publico-movil/PATRON.md) es renderizar los dos en
// el MISMO documento y dejar que el CSS decida en 700px — olfatear el
// user-agent rompería el caché de Vercel. Un rewrite a un archivo estático no
// puede hacer eso: sirve un documento ENTERO, o el otro. Por eso el rewrite se
// quitó y la ruta React se hace cargo del documento.
//
// ⚠️ EL HTML NO SE COPIA NI SE EDITA. Se lee el archivo tal cual y se parte en
// tres: el `<style>`, el marcado del `<body>` y sus `<script>`. El archivo
// sigue siendo la ÚNICA fuente del escritorio — quien edite el landing no tiene
// que tocar nada de React. (Alternativa descartada: extraerlo a un módulo TS
// como `template-v2-css.ts`; ahí el HTML sí quedaría duplicado y derivaría en
// silencio.)
//
// Dos detalles del corte, ambos deliberados:
//   · El pixel de Meta del landing vive en su `<head>`, no en el `<body>`, así
//     que el corte lo deja fuera solo. Es lo correcto: `src/app/layout.tsx` ya
//     dispara el PageView en toda ruta React, y dejar los dos habría contado el
//     doble.
//   · Los `<script>` salen del marcado y se re-emiten con `next/script`. Puestos
//     dentro de un `dangerouslySetInnerHTML` el navegador NO los ejecutaría, y
//     sin ellos el landing se queda sin logo (`[data-mark]`/`[data-word]`), sin
//     cabecera que cambia al scrollear, sin menú de hamburguesa, sin fechas en
//     vivo y sin grilla de experiencias. Los cuatro son código inmediato (IIFE),
//     ninguno espera `DOMContentLoaded`, así que corren igual al ejecutarse
//     después de que el DOM existe.
//
// Si el archivo cambia de forma (se le quita el `<style>` o el `<body>`), esto
// truena al construir con un mensaje claro, no en silencio.

import { readFileSync } from "node:fs";
import path from "node:path";

const ARCHIVO = path.join(process.cwd(), "public", "landing", "index.html");

export type LandingDoc = {
  /** El contenido del `<style>` del landing, verbatim. */
  css: string;
  /** El `<body>` sin sus `<script>`, verbatim. */
  body: string;
  /** Los scripts en línea, en orden. */
  scripts: string[];
  /** Los scripts externos (`src`), en orden. */
  srcs: string[];
};

function leer(): LandingDoc {
  const html = readFileSync(ARCHIVO, "utf8");

  const estilos = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  if (estilos.length === 0) {
    throw new Error("landing: public/landing/index.html no trae <style>");
  }

  const cuerpo = /<body[^>]*>([\s\S]*)<\/body>/.exec(html);
  if (!cuerpo) {
    throw new Error("landing: public/landing/index.html no trae <body>");
  }

  const scripts: string[] = [];
  const srcs: string[] = [];
  const body = cuerpo[1].replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
    (_todo, attrs: string, codigo: string) => {
      const src = /\ssrc=["']([^"']+)["']/.exec(attrs);
      if (src) srcs.push(src[1]);
      else if (codigo.trim()) scripts.push(codigo);
      return "";
    },
  );

  return { css: estilos.join("\n"), body, scripts, srcs };
}

let memo: LandingDoc | null = null;

/** El landing partido, leído una sola vez por proceso. */
export function landingDoc(): LandingDoc {
  return (memo ??= leer());
}
