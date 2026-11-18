// EL DOCUMENTO DE LA FUERZA MAYOR (D24.4 de legal). Puro: lo usan la ruta que
// sube el archivo, la acción que cancela la salida y las pruebas.

import type { ClaseFuerzaMayor } from "@/lib/cancelacion/politica";

export const BUCKET_FUERZA_MAYOR = "fuerza-mayor";

/**
 * La ruta que devuelve la subida: `YYYY-MM/<32 hex>.<ext>`. Se valida la FORMA
 * completa, no sólo que no traiga `..`: la ruta viaja por el cliente entre la
 * subida y la cancelación, y lo único que puede escribirse en la salida es algo
 * que esta casa generó.
 */
export const rutaDeDocumentoValida = (path: unknown): path is string =>
  typeof path === "string" && /^\d{4}-\d{2}\/[0-9a-f]{32}\.(pdf|jpeg|png|webp|heic)$/.test(path);

/**
 * ¿Esta clase de fuerza mayor se acredita con un archivo? Todas menos la
 * emergencia médica del guía, que se acredita con la declaración de la
 * operadora: un parte médico es dato de salud y no se guarda.
 */
export const pideDocumento = (clase: ClaseFuerzaMayor): boolean => clase !== "emergencia-guia";

/**
 * Qué se escribe en `cancelacion_documento_path`, o por qué no se puede.
 * Con documento obligatorio y sin ruta válida no se cancela; en la emergencia
 * del guía se escribe NULL aunque llegue una ruta.
 */
export function documentoDeFuerzaMayor(clase: ClaseFuerzaMayor, path: unknown): { ok: true; path: string | null } | { ok: false; error: string } {
  if (!pideDocumento(clase)) return { ok: true, path: null };
  if (!rutaDeDocumentoValida(path)) {
    return { ok: false, error: "Sube el documento que acredita la fuerza mayor (reporte, aviso o cierre de la autoridad) antes de cancelar." };
  }
  return { ok: true, path };
}
