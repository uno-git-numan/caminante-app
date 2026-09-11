#!/usr/bin/env node
// PUBLICAR UNA VERSIÓN DEL CONVENIO — de un .md al SQL que Luis corre.
//
// El texto del convenio vive en la base (`operator_agreement_versions.texto`),
// no en el código: publicar uno nuevo no debe necesitar un deploy. Pero el que
// se publica es el que un abogado cerró, y eso no lo decide un script.
//
// Esto sólo hace la parte mecánica y peligrosa: calcular el sha-256 del texto
// EXACTO que se va a mostrar en pantalla, y armar el INSERT. El hash es lo que
// cierra la discusión de «yo no firmé eso», así que no se teclea a mano.
//
//   node scripts/publicar-convenio.mjs <archivo.md> <version> <mayor|menor> [AAAA-MM-DD]
//
// Ejemplo:
//   node scripts/publicar-convenio.mjs design/operadores/CONVENIO-FINAL.md v1 mayor 2026-10-15
//
// Escribe el SQL en stdout. Se revisa, se compara el hash, y se corre.
//
// ⚠️ UN CAMBIO MAYOR SE PUBLICA CON ANTICIPACIÓN. `vigente_desde` es la fecha en
// que empieza a ser exigible; hasta entonces el Operador sigue vendiendo con la
// versión vieja (convenio.ts, DIAS_DE_AVISO = 30). Publicar un mayor con fecha
// de hoy le cae encima a quien esté vendiendo.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const [, , archivo, version, tipo, desde] = process.argv;

if (!archivo || !version || !tipo) {
  console.error("uso: node scripts/publicar-convenio.mjs <archivo.md> <version> <mayor|menor> [AAAA-MM-DD]");
  process.exit(1);
}
if (tipo !== "mayor" && tipo !== "menor") {
  console.error("el tipo es 'mayor' (bloquea, se avisa con 30 días) o 'menor' (sólo se avisa)");
  process.exit(1);
}

const texto = readFileSync(archivo, "utf8");

// Guardas contra publicar un borrador de trabajo por accidente. Los tres son
// marcadores que el documento de revisión legal trae y un convenio firmable no.
const sospechas = [
  [/REVISI[ÓO]N LEGAL/i, "dice «revisión legal» — es el documento de trabajo, no el que se firma"],
  [/🔸/, "trae marcadores 🔸 de preguntas abiertas para el abogado"],
  [/no ser un documento firmable|ning[úu]n abogado/i, "el propio texto dice que todavía no es firmable"],
];
const encontradas = sospechas.filter(([re]) => re.test(texto)).map(([, q]) => q);
if (encontradas.length) {
  console.error("NO SE PUBLICA. El archivo parece un borrador:");
  for (const q of encontradas) console.error("  · " + q);
  console.error("\nPublica el texto que cerró el abogado, sin las notas de revisión.");
  process.exit(1);
}

const hash = createHash("sha256").update(texto, "utf8").digest("hex");
const vigente = desde ? `'${desde}T00:00:00Z'` : "now()";
const titulo = (texto.split("\n").find((l) => l.startsWith("# ")) ?? "# Convenio").slice(2).trim();
const q = (s) => "'" + s.replace(/'/g, "''") + "'";

console.log(`-- Convenio ${version} (${tipo}) · generado por scripts/publicar-convenio.mjs
-- Fuente: ${archivo}
-- sha-256 del texto: ${hash}
--
-- Verifica el hash ANTES de correr:
--   shasum -a 256 ${archivo}
-- Tiene que dar exactamente ${hash}
--
-- El INSERT recalcula el hash del texto que de verdad aterrizó, y el CHECK de
-- abajo revienta si no coincide: si el pegado perdió un carácter, no se publica.

insert into public.operator_agreement_versions (version, orden, tipo, titulo, texto, hash, vigente_desde)
select ${q(version)},
       coalesce((select max(orden) from public.operator_agreement_versions), 0) + 1,
       ${q(tipo)},
       ${q(titulo)},
       t.texto,
       encode(sha256(convert_to(t.texto, 'UTF8')), 'hex'),
       ${vigente}
from (select $doc$${texto}$doc$::text as texto) t;

do $$
declare h text;
begin
  select hash into h from public.operator_agreement_versions where version = ${q(version)};
  if h is distinct from ${q(hash)} then
    raise exception 'el texto que llegó no es el que se generó (hash % != %)', h, ${q(hash)};
  end if;
  raise notice 'convenio ${version} publicado · hash %', h;
end $$;
`);
