#!/usr/bin/env node
// Difusión de WhatsApp por template (Cloud API) a la lista de clientes.
//
// Reutilizable: hoy manda el flyer; mañana cualquier template (recordatorios, ofertas).
// Por defecto hace DRY-RUN (no manda nada): normaliza, deduplica, valida y previsualiza.
// Para mandar de verdad: --send  (requiere creds en el entorno + template aprobado).
//
// Fuente de destinatarios:
//   --json scripts/recipients.json         (default; semilla exportada de Notion)
//   --csv  ~/Downloads/AllClients.csv       (export nativo de Notion → columnas Name,Phone)
//
// Uso:
//   node scripts/broadcast-whatsapp.mjs                       # dry-run con el JSON semilla
//   node scripts/broadcast-whatsapp.mjs --csv ruta.csv        # dry-run desde CSV de Notion
//   WHATSAPP_PHONE_NUMBER_ID=... WHATSAPP_ACCESS_TOKEN=... \
//   node scripts/broadcast-whatsapp.mjs --send \
//        --template caminante_flyer_v1 --lang es_MX \
//        --flyer-url https://caminante.numanhub.com/flyers/ensenada.jpg
//
// Env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_GRAPH_VERSION (default v21.0)

import { readFileSync, writeFileSync } from "node:fs";
import { normalizePhone, firstName } from "./lib/phone.mjs";

// ── args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);

const SEND = has("send");
const jsonPath = flag("json", "scripts/recipients.json");
const csvPath = flag("csv");
const templateName = flag("template", "caminante_flyer_v1");
const lang = flag("lang", "es_MX");
const flyerUrl = flag("flyer-url");
const limit = parseInt(flag("limit", "0"), 10) || 0;

// ── leer destinatarios ──────────────────────────────────────────────────────────
function fromCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines.shift().split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const nameCol = header.findIndex((h) => h === "name" || h === "nombre");
  const phoneCol = header.findIndex((h) => h === "phone" || h === "teléfono" || h === "telefono");
  if (nameCol < 0 || phoneCol < 0) throw new Error("CSV sin columnas Name/Phone reconocibles");
  // parser CSV mínimo (maneja comillas)
  const parse = (line) => {
    const out = [];
    let cur = "", q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.replace(/^"|"$/g, ""));
  };
  return lines.map((l) => { const c = parse(l); return { name: c[nameCol], phone: c[phoneCol] }; });
}

let raw;
if (csvPath) raw = fromCsv(readFileSync(csvPath, "utf8"));
else raw = JSON.parse(readFileSync(jsonPath, "utf8"));

// ── normalizar + deduplicar ────────────────────────────────────────────────────
const valid = [];
const skipped = [];
const seen = new Map(); // e164 → name (para detectar duplicados)

for (const r of raw) {
  const { e164, reason, country } = normalizePhone(r.phone);
  if (!e164) { skipped.push({ ...r, reason: reason || "inválido" }); continue; }
  if (seen.has(e164)) { skipped.push({ ...r, reason: `duplicado de "${seen.get(e164)}"` }); continue; }
  seen.set(e164, r.name);
  valid.push({ name: r.name, e164, first: firstName(r.name), country });
}

const audience = limit ? valid.slice(0, limit) : valid;

// ── reporte ──────────────────────────────────────────────────────────────────
console.log(`\n📋 Difusión WhatsApp — ${SEND ? "ENVÍO REAL" : "DRY-RUN (no se manda nada)"}`);
console.log(`   Fuente: ${csvPath ? "CSV " + csvPath : "JSON " + jsonPath}`);
console.log(`   Template: ${templateName} (${lang})   Flyer: ${flyerUrl || "(falta --flyer-url)"}`);
console.log(`   Total en lista: ${raw.length} · Válidos únicos: ${valid.length} · A enviar: ${audience.length}\n`);

const byCountry = audience.reduce((a, r) => ((a[r.country] = (a[r.country] || 0) + 1), a), {});
console.log("   Por país:", JSON.stringify(byCountry));

if (skipped.length) {
  console.log(`\n⚠️  Omitidos (${skipped.length}):`);
  for (const s of skipped) console.log(`   - ${s.name || "(sin nombre)"} · ${s.phone ?? "—"} → ${s.reason}`);
}

console.log(`\n👀 Muestra (primeros 5):`);
for (const r of audience.slice(0, 5)) console.log(`   ${r.e164}  ·  Hola {{1}}=${r.first}  ·  ${r.name}`);

// ── envío ──────────────────────────────────────────────────────────────────────
if (!SEND) {
  console.log(`\n✅ Dry-run OK. Para enviar de verdad: agrega --send + creds + --flyer-url.\n`);
  process.exit(0);
}

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";
if (!PHONE_ID || !TOKEN) { console.error("❌ Faltan WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN."); process.exit(1); }
if (!flyerUrl) { console.error("❌ Falta --flyer-url (header de imagen del template)."); process.exit(1); }

const url = `https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`;
const results = [];

for (const r of audience) {
  const body = {
    messaging_product: "whatsapp",
    to: r.e164,
    type: "template",
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        { type: "header", parameters: [{ type: "image", image: { link: flyerUrl } }] },
        { type: "body", parameters: [{ type: "text", text: r.first || "amig@" }] },
      ],
    },
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    const ok = res.ok && json.messages?.[0]?.id;
    results.push({ name: r.name, e164: r.e164, ok: !!ok, id: json.messages?.[0]?.id, error: json.error?.message });
    console.log(`${ok ? "✓" : "✗"} ${r.e164} ${ok ? json.messages[0].id : json.error?.message}`);
  } catch (e) {
    results.push({ name: r.name, e164: r.e164, ok: false, error: e.message });
    console.log(`✗ ${r.e164} ${e.message}`);
  }
  await new Promise((res) => setTimeout(res, 250)); // ~4/seg, suave con el rate limit
}

const sent = results.filter((r) => r.ok).length;
const out = `scripts/broadcast-results-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`\n📊 Enviados ${sent}/${results.length}. Log: ${out}\n`);
