// LO QUE DICE EL .cer DEL CSD, leído del propio archivo.
//
// Hasta el 9 nov 2026 la fecha de vigencia del CSD se tecleaba («la trae el
// acuse del SAT»). No hace falta: el certificado es un X.509 y trae su fecha de
// fin (`notAfter`) y el RFC del titular (`x500UniqueIdentifier`, que el SAT
// llena como «RFC / RFC del representante»). Un dato que ya viene en el
// archivo no se le pide a nadie (meta del alta en 15 minutos).

import { X509Certificate } from "node:crypto";

export type LecturaCer = { rfc: string | null; venceAt: string };

/** Lee el `.cer` (DER o PEM). `null` si no es un certificado. */
export function leerCer(bytes: Buffer): LecturaCer | null {
  let c: X509Certificate;
  try {
    c = new X509Certificate(bytes);
  } catch {
    return null;
  }
  const fin = new Date(c.validTo);
  if (Number.isNaN(fin.getTime())) return null;
  const uid = c.subject.split("\n").find((l) => l.startsWith("x500UniqueIdentifier="));
  const rfc = uid?.slice("x500UniqueIdentifier=".length).split("/")[0].trim().toUpperCase() || null;
  return { rfc, venceAt: fin.toISOString().slice(0, 10) };
}
