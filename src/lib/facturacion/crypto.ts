import "server-only";

// CIFRADO DE LAS LLAVES DE FACTURAPI POR OPERADORA (0076).
//
// Facturapi devuelve la llave Live de una organización COMPLETA sólo al crearla
// (después, la lista sólo enseña los primeros 12 caracteres), así que hay que
// conservarla. Va a la base cifrada con AES-256-GCM y una llave maestra que
// vive en el entorno (`FACTURAPI_KEY_SECRET`, 32 bytes en base64; la pone Luis
// en Vercel). Sin la maestra, la columna es ruido. Nunca se loggea ni se manda
// al cliente.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function maestra(): Buffer {
  const raw = process.env.FACTURAPI_KEY_SECRET;
  if (!raw) throw new Error("FACTURAPI_KEY_SECRET no configurada");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("FACTURAPI_KEY_SECRET debe ser 32 bytes en base64");
  return k;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", maestra(), iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return `v1.${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function descifrar(blob: string): string {
  const [v, iv, tag, enc] = blob.split(".");
  if (v !== "v1" || !iv || !tag || !enc) throw new Error("Blob cifrado inválido");
  const d = createDecipheriv("aes-256-gcm", maestra(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64")), d.final()]).toString("utf8");
}

/** ¿Podemos cifrar? Sin la maestra no se guardan llaves (y no se abren organizaciones). */
export const cifradoActivo = () => !!process.env.FACTURAPI_KEY_SECRET;
