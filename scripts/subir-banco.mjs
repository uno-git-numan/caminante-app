// Sube fotos al Banco de fotos tipificado (experiences.data.photoBank) de una experiencia.
// Parte del ciclo de contenido v3 (/post-rodaje): al volver de un viaje, las fotos clasificadas
// se suben por slot y el Kit (serie E) las consume.
//
// Uso:  node scripts/subir-banco.mjs <manifest.json>
//   manifest = { "slug": "recoleccion-de-hongos",
//                "slots": { "paisaje": ["/ruta/a.jpg", ...], "gente": [...], ... } }
//   Slots válidos: flora, paisaje, comunidad, comida, gente, problemas, cielo, detalle.
//
// Qué hace:
//   - Sube cada archivo al bucket público `experiences` bajo uploads/banco/<slug>/<slot>-<nombre>.
//   - MERGE en experiences.data.photoBank[slot] (append + dedupe por URL). NUNCA reemplaza.
//   - Corre desde la raíz del repo (lee .env.local: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
//
// ⚠️ Redimensiona ANTES con sips (como el uploader de la app):
//   sips -Z 2560 -s format jpeg "<original>" --out "<destino>.jpg"
// ⚠️ Clasificación: la decide un humano o Claude VIENDO las fotos. Reglas aprendidas (memoria
//   caminante-banco-fotos-ficha-serie-e): la foto de ciencia va en paisaje/cielo y NUNCA contradice
//   el texto; un macro del sujeto del nicho (ej. hongo) SÍ es paisaje para ese nicho; interiores,
//   comida y gente en primer plano JAMÁS van a paisaje.

import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ENV = new URL("../.env.local", import.meta.url).pathname;
const env = Object.fromEntries(
  readFileSync(ENV, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  })
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("faltan claves en .env.local"); process.exit(1); }
const sb = createClient(URL_, KEY, { auth: { persistSession: false } });
const BUCKET = "experiences";
const SLOTS = ["flora", "paisaje", "comunidad", "comida", "gente", "problemas", "cielo", "detalle"];

const manifest = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { slug, slots } = manifest;
if (!slug || !slots) { console.error("manifest inválido: se requiere { slug, slots }"); process.exit(1); }
const malos = Object.keys(slots).filter((s) => !SLOTS.includes(s));
if (malos.length) { console.error("slots inválidos:", malos.join(", "), "· válidos:", SLOTS.join(", ")); process.exit(1); }

const { data: row, error: e0 } = await sb.from("experiences").select("data").eq("slug", slug).maybeSingle();
if (e0 || !row) { console.error("no existe la experiencia", slug, e0?.message); process.exit(1); }
const data = row.data || {};
const bank = data.photoBank || {};

let subidas = 0;
for (const [slot, paths] of Object.entries(slots)) {
  const urls = new Set(bank[slot] || []);
  for (const p of paths) {
    const buf = readFileSync(p);
    const clean = basename(p).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.]+/g, "-");
    const key = `uploads/banco/${slug}/${slot}-${clean}`;
    const up = await sb.storage.from(BUCKET).upload(key, buf, { contentType: "image/jpeg", upsert: true });
    if (up.error) { console.error("  ✗", clean, up.error.message); continue; }
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(key);
    urls.add(pub.publicUrl);
    subidas++;
    console.log(`  ✓ ${slot} ← ${basename(p)}`);
  }
  bank[slot] = [...urls];
}

data.photoBank = bank;
const { error: e1 } = await sb.from("experiences").update({ data }).eq("slug", slug);
if (e1) { console.error("no se pudo guardar photoBank:", e1.message); process.exit(1); }

console.log(`\n✅ ${slug}: ${subidas} fotos subidas.`);
console.log("photoBank ahora:", Object.fromEntries(Object.entries(bank).map(([k, v]) => [k, v.length])));
