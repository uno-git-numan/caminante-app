#!/usr/bin/env node
// EXTRAER EL CSS DE UN ENTREGABLE DE CLAUDE DESIGN, con scope.
//
// Los .dc.html traen el sistema del panel COMPLETO dentro. Copiarlo entero
// crearía un segundo sistema que se va separando del primero: el día que se
// ajuste un color en `admin-css.ts`, esa pantalla se quedaría con el viejo.
// Aquí sale sólo el DELTA —lo que admin-css NO tiene— y todo prefijado.
//
// ⚠️ POR QUÉ EXISTE ESTE SCRIPT Y NO SE HACE A MANO. El primer intento
// (`mi-alta-css.ts`, 8 sep 2026) prefijó con un reemplazo de texto que no
// entendía comentarios: cada regla que venía después de un `/* … */` se quedó
// SIN `.adm` y acabó en el scope global. Fueron 39, entre ellas `.docs` y
// `.calm` — nombres lo bastante comunes como para chocar con otra pantalla. No
// se veía porque la pantalla se ve bien: el CSS de más no rompe lo suyo, rompe
// lo ajeno.
//
// Correr:  node scripts/extraer-css-dc.mjs <entregable.html> <CONSTANTE> <salida.ts>

import { readFileSync, writeFileSync } from "node:fs";

const ADMIN = "src/app/caminante/admin/ui/admin-css.ts";
const [origen, constante, destino] = process.argv.slice(2);
if (!origen || !constante || !destino) {
  console.error("uso: extraer-css-dc.mjs <entregable.html> <CONSTANTE> <salida.ts>");
  process.exit(1);
}

const html = readFileSync(origen, "utf8");
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
if (!css.trim()) { console.error("El entregable no trae <style>."); process.exit(1); }

// 1 · Fuera comentarios. Es lo primero, y es lo que se saltó el intento anterior.
const limpio = css.replace(/\/\*[\s\S]*?\*\//g, "");

// 2 · Trocear en reglas con una pila, para no romperse con @media anidado.
function reglas(txt) {
  const out = [];
  let buf = "", prof = 0, sel = "";
  for (const ch of txt) {
    if (ch === "{") {
      prof++;
      if (prof === 1) { sel = buf.trim(); buf = ""; continue; }
    } else if (ch === "}") {
      prof--;
      if (prof === 0) { out.push({ sel, cuerpo: buf }); buf = ""; sel = ""; continue; }
    }
    buf += ch;
  }
  return out;
}


const fuera = (sel) => /^@(font-face|keyframes|import|charset)/.test(sel.trim());

// Lo que define el SISTEMA del panel no se copia: `admin-css.ts` ya lo tiene y
// dos definiciones de `--lagoon` es una que se queda vieja.
const esGlobal = (sel) =>
  sel.split(",").some((s) => /^\s*(:root|html|body|\*)\s*$/.test(s));

const prefijar = (selectores) =>
  selectores
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith(":root") || s === "html" || s === "body" ? `.adm` : `.adm ${s}`))
    .join(",");

// EL DELTA. Se compara el SELECTOR COMPLETO, no sus clases sueltas.
//
// El primer intento preguntaba «¿existen todas estas clases en admin-css?», y
// eso tiró `.doc.pend` —el fondo naranja de un documento pendiente— porque
// `.doc` y `.pend` existen cada una por su lado. La combinación no existía, y
// perderla habría dejado ese estado sin color: un pendiente que se ve igual que
// uno resuelto. Un selector sólo está vestido si admin-css trae ESE selector.
const admin = readFileSync(ADMIN, "utf8");
const normal = (sel) => sel.replace(/\s+/g, " ").trim();
const yaVestidos = new Set(
  [...admin.matchAll(/(^|\n)([^{}\n]+)\{/g)].flatMap((m) =>
    m[2].split(",").map((s) => normal(s)),
  ),
);
// ⚠️ Se compara YA PREFIJADO. En admin-css los selectores viven como
// `.adm .foo`, y en el entregable como `.foo`: compararlos crudos no coincide
// NUNCA, y el filtro deja pasar el sistema entero — 103 KB en vez de 38.
const yaVestida = (sel) =>
  prefijar(sel).split(",").every((s) => yaVestidos.has(normal(s)));

const lineas = [];
for (const { sel, cuerpo } of reglas(limpio)) {
  if (!sel || fuera(sel) || esGlobal(sel) || yaVestida(sel)) continue;
  if (sel.trim().startsWith("@media") || sel.trim().startsWith("@supports")) {
    const dentro = reglas(cuerpo)
      .filter((r) => r.sel && !fuera(r.sel) && !esGlobal(r.sel) && !yaVestida(r.sel))
      .map((r) => `${prefijar(r.sel)}{${r.cuerpo.trim()}}`);
    if (dentro.length) lineas.push(`${sel.trim()}{${dentro.join("")}}`);
    continue;
  }
  lineas.push(`${prefijar(sel)}{${cuerpo.trim()}}`);
}

// 3 · EL CANDADO. Ninguna línea puede empezar por algo que no sea `.adm` o `@`.
const fugadas = lineas.filter((l) => !l.startsWith(".adm") && !l.startsWith("@"));
if (fugadas.length) {
  console.error(`ABORTADO: ${fugadas.length} regla(s) sin scope. La primera:\n  ${fugadas[0].slice(0, 120)}`);
  process.exit(1);
}

writeFileSync(
  destino,
  `// Generado por scripts/extraer-css-dc.mjs desde ${origen}\n` +
    `// ⚠️ NO editar a mano: si el diseño cambia se re-entrega y se re-extrae.\n` +
    `// Sólo va el delta del entregable, con TODOS los selectores bajo \`.adm\`.\n\n` +
    `export const ${constante} = String.raw\`\n${lineas.join("\n")}\n\`;\n`,
);
console.log(`${lineas.length} reglas · todas con scope · → ${destino}`);
