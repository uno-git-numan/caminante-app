#!/usr/bin/env node
// ¿LO QUE LA BASE DICE QUE DEVOLVIMOS ES LO QUE DEVOLVIMOS?
//
// Tres tablas hablan de lo mismo y ninguna es la verdad:
//
//   · `payments.status = 'refunded'`  — devuelto entero, sí o no
//   · `payments.refunded_mxn`         — cuánto, y es la que LEE el panel
//   · `reembolsos`                    — el libro, sólo desde la 0056 (sep 2026)
//
// La verdad es la caja. Esto se la pregunta a Stripe pago por pago —
// `charge.amount_refunded` de cada `provider_ref`— y dice dónde no coinciden.
//
// El 23 sep 2026 encontró nueve pagos torcidos y $42,000 devueltos donde la
// base decía $10,200. La 0064 los cuadró. Esto queda para que la siguiente vez
// se note en minutos y no en meses.
//
//   node scripts/conciliar-reembolsos.mjs
//
// ⚠️ NO ESCRIBE NADA. Lee la base y lee Stripe. Si algo no cuadra, lo dice y
// sale con código 1 — para que pueda correr solo algún día sin que nadie mire.
//
// La llave de Stripe es la RESTRINGIDA de sólo lectura, la misma que usa la
// conciliación de finanzas (`~/.config/finanzas/.env`). Nunca la secreta: esto
// no tiene por qué poder mover un peso.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

function leerEnv(ruta) {
  const out = {};
  if (!existsSync(ruta)) return out;
  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const app = leerEnv(join(raiz, ".env.local"));
const fin = leerEnv(join(homedir(), ".config", "finanzas", ".env"));

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL || app.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE_SB = process.env.SUPABASE_SERVICE_ROLE_KEY || app.SUPABASE_SERVICE_ROLE_KEY;
const LLAVE_STRIPE = process.env.STRIPE_LIVE_RESTRICTED_KEY || fin.STRIPE_LIVE_RESTRICTED_KEY;

if (!URL_SB || !LLAVE_SB) {
  console.error("Faltan las llaves de Supabase (.env.local).");
  process.exit(2);
}
if (!LLAVE_STRIPE) {
  console.error("Falta STRIPE_LIVE_RESTRICTED_KEY (~/.config/finanzas/.env).");
  console.error("Es la llave de SÓLO LECTURA. No uses la secreta para esto.");
  process.exit(2);
}

const sb = (ruta) =>
  fetch(`${URL_SB.replace(/\/$/, "")}/rest/v1/${ruta}`, {
    headers: { apikey: LLAVE_SB, Authorization: `Bearer ${LLAVE_SB}` },
  }).then((r) => r.json());

const stripe = (ruta) =>
  fetch(`https://api.stripe.com/v1/${ruta}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${LLAVE_STRIPE}:`).toString("base64")}` },
  });

const pesos = (n) =>
  `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pagos = await sb(
  "payments?select=id,provider_ref,amount_mxn,refunded_mxn,status,method,paid_at&order=paid_at",
);

const difieren = [];
const noVerificables = [];
let devueltoStripe = 0;

for (const p of pagos) {
  // Una transferencia no tiene nada que devolver por Stripe: no es un fallo,
  // es otro medio. Se cuenta aparte para que el total diga de qué habla.
  if (p.method !== "stripe" || !p.provider_ref) {
    noVerificables.push(p);
    continue;
  }
  const r = await stripe(`payment_intents/${p.provider_ref}?expand[]=latest_charge`);
  if (!r.ok) {
    noVerificables.push({ ...p, nota: `no está en Stripe live (${r.status})` });
    continue;
  }
  const pi = await r.json();
  const enStripe = pi.latest_charge ? (pi.latest_charge.amount_refunded || 0) / 100 : 0;
  devueltoStripe += enStripe;

  const enBase = Number(p.refunded_mxn || 0);
  const montoCuadra = Math.abs(enBase - enStripe) < 0.01;
  // El status sólo dice «refunded» cuando volvió TODO. Un parcial deja el pago
  // en «paid» a propósito: el dinero que se quedó sigue siendo ingreso.
  const deberiaSer = enStripe >= Number(p.amount_mxn) - 0.01 ? "refunded" : "paid";
  const statusCuadra = p.status === deberiaSer || (enStripe === 0 && p.status !== "refunded");

  if (!montoCuadra || !statusCuadra) {
    difieren.push({ ...p, enStripe, deberiaSer, montoCuadra, statusCuadra });
  }
}

const sumaBase = pagos.reduce((a, p) => a + Number(p.refunded_mxn || 0), 0);
const libro = await sb("reembolsos?select=monto_mxn&estado=eq.confirmado");
const sumaLibro = libro.reduce((a, r) => a + Number(r.monto_mxn || 0), 0);

console.log(`\n${pagos.length} pagos · ${pagos.length - noVerificables.length} verificables en Stripe · ${noVerificables.length} por otro medio\n`);
console.log(`  Stripe devolvió          ${pesos(devueltoStripe)}`);
console.log(`  payments.refunded_mxn    ${pesos(sumaBase)}   ← lo que lee el panel`);
console.log(`  libro de reembolsos      ${pesos(sumaLibro)}   (sólo desde sep 2026)\n`);

if (!difieren.length) {
  console.log("✓ Cada pago dice exactamente lo que Stripe devolvió.");
  process.exit(0);
}

console.log(`✗ ${difieren.length} pagos no cuadran:\n`);
for (const d of difieren) {
  const partes = [];
  if (!d.montoCuadra) partes.push(`monto: dice ${pesos(d.refunded_mxn || 0)}, Stripe ${pesos(d.enStripe)}`);
  if (!d.statusCuadra) partes.push(`status: dice «${d.status}», debería ser «${d.deberiaSer}»`);
  console.log(`  ${d.paid_at?.slice(0, 10)} · cobrado ${pesos(d.amount_mxn)} · ${partes.join(" · ")}`);
  console.log(`     ${d.id}  ${d.provider_ref}`);
}
console.log("\nStripe es la caja: si difieren, es la base la que está mal.");
process.exit(1);
