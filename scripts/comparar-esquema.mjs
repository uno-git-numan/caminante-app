#!/usr/bin/env node
// ¿STAGING SE PARECE A PRODUCCIÓN? — la pregunta que hace útil a un ambiente.
//
// Un staging que no cuadra con producción es peor que no tener staging: las
// pruebas pasan contra un esquema que no existe, y la confianza que dan es
// falsa. Esto lo mide en vez de suponerlo.
//
// Y de paso contesta una pregunta vieja del repo: los archivos de migración NO
// son el estado de la base (ver .claude/rules/migraciones.md). El caso conocido
// es la 0001, que crea ocho tablas del marketplace —trips, bookings,
// participants…— que producción nunca tuvo. Correr las 59 desde cero deja esas
// ocho de más, y esta comparación es la que lo enseña.
//
// Uso:
//   node scripts/comparar-esquema.mjs --contra <ref-de-staging>
//
// Lee las dos bases por PostgREST, que expone su esquema en la raíz. No
// necesita el token de la Management API: le basta la anon key de cada
// proyecto, que es pública por diseño.
//
//   PROD_URL / PROD_KEY        (por defecto salen de .env.local)
//   STAGING_URL / STAGING_KEY  (obligatorias)

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

// .env.local sólo para PRODUCCIÓN, que es la referencia. Staging va por
// entorno: así no hay forma de compararse contra sí mismo por accidente.
const env = {};
const ruta = join(raiz, ".env.local");
if (existsSync(ruta)) {
  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}

const prodUrl = process.env.PROD_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const prodKey = process.env.PROD_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const stagingUrl = process.env.STAGING_URL;
const stagingKey = process.env.STAGING_KEY;

if (!prodUrl || !prodKey) {
  console.error("No encontré las llaves de producción (.env.local o PROD_URL/PROD_KEY).");
  process.exit(1);
}
if (!stagingUrl || !stagingKey) {
  console.error("Faltan STAGING_URL y STAGING_KEY en el entorno.");
  console.error("Salen del dashboard del proyecto de staging → Settings → API.");
  process.exit(1);
}

async function esquema(url, key) {
  const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  const d = await r.json();
  const tablas = {};
  for (const [nombre, def] of Object.entries(d.definitions ?? {})) {
    tablas[nombre] = new Set(Object.keys(def.properties ?? {}));
  }
  return tablas;
}

const [prod, staging] = await Promise.all([
  esquema(prodUrl, prodKey),
  esquema(stagingUrl, stagingKey),
]);

const enProd = new Set(Object.keys(prod));
const enStaging = new Set(Object.keys(staging));

const faltan = [...enProd].filter((t) => !enStaging.has(t)).sort();
const sobran = [...enStaging].filter((t) => !enProd.has(t)).sort();

// Sólo se comparan columnas de las tablas que están en las dos: de las otras ya
// se dijo lo que hay que decir.
const columnas = [];
for (const t of [...enProd].filter((x) => enStaging.has(x)).sort()) {
  const f = [...prod[t]].filter((c) => !staging[t].has(c));
  const s = [...staging[t]].filter((c) => !prod[t].has(c));
  if (f.length || s.length) columnas.push({ t, f, s });
}

console.log(`producción: ${enProd.size} tablas   ·   staging: ${enStaging.size} tablas\n`);

if (faltan.length) {
  console.log(`✗ FALTAN en staging (${faltan.length}) — las pruebas mentirían:`);
  for (const t of faltan) console.log(`    ${t}`);
  console.log();
}
if (sobran.length) {
  console.log(`⚠ SOBRAN en staging (${sobran.length}) — ruido, no riesgo:`);
  for (const t of sobran) console.log(`    ${t}`);
  console.log();
}
if (columnas.length) {
  console.log(`✗ COLUMNAS distintas (${columnas.length} tablas):`);
  for (const { t, f, s } of columnas) {
    if (f.length) console.log(`    ${t}: faltan  ${f.join(", ")}`);
    if (s.length) console.log(`    ${t}: sobran  ${s.join(", ")}`);
  }
  console.log();
}

if (!faltan.length && !columnas.length) {
  console.log(sobran.length
    ? "Staging tiene todo lo de producción. Lo que sobra no estorba."
    : "Staging y producción coinciden tabla por tabla y columna por columna.");
  process.exit(0);
}
// Que falte algo es un fallo: es la diferencia entre una prueba que vale y una
// que da confianza falsa.
process.exit(1);
