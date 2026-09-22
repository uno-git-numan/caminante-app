#!/usr/bin/env node
// APLICAR MIGRACIONES POR LA MANAGEMENT API — sin navegador y sin pegar nada.
//
// Hasta hoy la única forma de correr una migración era el SQL Editor del
// dashboard, a mano. Eso funciona para UNA migración sobre producción —donde
// además queremos que sea lento y deliberado— pero no para levantar un
// ambiente desde cero: son 59 archivos y 219 KB, y hacerlo por el navegador no
// deja nada repetible. El día que haya que rehacer staging, o que CI quiera su
// propia base limpia, esto tiene que ser un comando.
//
// ⚠️ ESTO NO RELAJA LA REGLA DE PRODUCCIÓN. Sigue vigente: sobre la base de
// producción las migraciones las aplica Luis, una por una, comparando el hash.
// Este script se niega a correr contra un proyecto que no le hayas nombrado
// explícitamente, imprime el sha-256 de cada archivo ANTES de mandarlo, y
// exige `--si` para escribir. Su caso de uso es levantar y re-levantar
// ambientes desechables.
//
// Uso:
//   SUPABASE_ACCESS_TOKEN=sbp_…  node scripts/aplicar-migraciones.mjs \
//     --proyecto <ref> [--desde 0001] [--hasta 0060] [--si]
//
// Sin `--si` hace un ENSAYO: lista qué correría, en qué orden y con qué hash.
//
// El token es un Personal Access Token de Supabase
// (https://supabase.com/dashboard/account/tokens). Va por variable de entorno,
// nunca por argumento: los argumentos quedan en el historial del shell y se
// ven en `ps`.

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(raiz, "supabase", "migrations");

const arg = (nombre, porDefecto = null) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : porDefecto;
};
const bandera = (n) => process.argv.includes(`--${n}`);

const token = process.env.SUPABASE_ACCESS_TOKEN;
const proyecto = arg("proyecto");
const desde = arg("desde", "0000");
const hasta = arg("hasta", "9999");
const enSerio = bandera("si");

if (!proyecto) {
  console.error("Falta --proyecto <ref>. El ref sale de la URL del dashboard.");
  process.exit(1);
}
if (!token) {
  console.error("Falta SUPABASE_ACCESS_TOKEN en el entorno.");
  console.error("Se crea en https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

// ⚠️ LA GUARDA QUE IMPORTA. El ref de producción vive aquí escrito para que
// este script no pueda correrle encima por un dedazo, ni aunque alguien le pase
// el ref correcto. Producción se toca por el SQL Editor, con el hash a la vista.
const PRODUCCION = "hnyoahirxmzkshivgvnm";
if (proyecto === PRODUCCION) {
  console.error("Ese es el proyecto de PRODUCCIÓN. Las migraciones de producción");
  console.error("las aplica Luis por el SQL Editor, comparando el hash. Ver");
  console.error(".claude/rules/migraciones.md.");
  process.exit(1);
}

const archivos = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .filter((f) => {
    const n = f.slice(0, 4);
    return n >= desde && n <= hasta;
  });

if (!archivos.length) {
  console.error(`No hay migraciones entre ${desde} y ${hasta}.`);
  process.exit(1);
}

const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");

console.log(`${enSerio ? "APLICANDO" : "ENSAYO —"} ${archivos.length} migraciones sobre «${proyecto}»\n`);

async function correr(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${proyecto}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${r.status} · ${texto.slice(0, 500)}`);
  return texto;
}

let aplicadas = 0;
for (const f of archivos) {
  const sql = readFileSync(join(DIR, f), "utf8");
  // El hash se imprime SIEMPRE, corra o no: es el mismo número que se compara
  // a mano en el SQL Editor, y así el ensayo sirve de hoja de verificación.
  console.log(`  ${f.padEnd(52)} ${sha(sql).slice(0, 16)}…  ${Buffer.byteLength(sql, "utf8").toLocaleString()} bytes`);
  if (!enSerio) continue;
  try {
    await correr(sql);
    aplicadas++;
  } catch (e) {
    console.error(`\n✗ Falló en ${f}:\n  ${e.message}\n`);
    console.error(`Se aplicaron ${aplicadas} antes de ésta. Corrige y vuelve a correr`);
    console.error(`con --desde ${f.slice(0, 4)} para retomar donde se quedó.`);
    process.exit(1);
  }
}

if (!enSerio) {
  console.log(`\nEnsayo. Para aplicarlas de verdad, agrega --si`);
} else {
  console.log(`\n${aplicadas} migraciones aplicadas sobre «${proyecto}».`);
  console.log(`Verifica el esquema con: node scripts/comparar-esquema.mjs --contra ${proyecto}`);
}
