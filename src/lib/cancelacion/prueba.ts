import "server-only";

// LA PRUEBA DE LA POLÍTICA QUE ACEPTÓ EL CLIENTE (D23 de legal, §3; 0089).
//
// No hay casilla: el texto está a la vista antes de pagar y junto al botón dice
// «Al pagar aceptas la política de cancelación de esta experiencia». Lo que
// queda como prueba, en cada reserva: la variante, la huella sha-256 del texto
// que se le mostró y la fecha en que se creó el cobro. Si el texto cambia
// después, cada reserva conserva el que aceptó.

import { createHash } from "node:crypto";
import { esVariante, textoPolitica, type Variante } from "@/lib/cancelacion/politica";

export type PruebaDePolitica = { politica_variante: Variante; politica_hash: string; politica_aceptada_at: string };

/** La prueba para una experiencia con esa variante; null si no tiene política elegida. */
export function pruebaDePolitica(variante: unknown, ahora = new Date()): PruebaDePolitica | null {
  if (!esVariante(variante)) return null;
  return {
    politica_variante: variante,
    politica_hash: createHash("sha256").update(textoPolitica(variante), "utf8").digest("hex"),
    politica_aceptada_at: ahora.toISOString(),
  };
}

/** La prueba que viajó en la metadata del cobro (la caja web la manda; el webhook la escribe). */
export function pruebaDeMetadata(md: Record<string, string | undefined> | null | undefined): PruebaDePolitica | null {
  const v = md?.politica_variante;
  const h = md?.politica_hash ?? "";
  const at = md?.politica_aceptada_at ?? "";
  if (!esVariante(v) || !/^[0-9a-f]{64}$/.test(h) || !Number.isFinite(new Date(at).getTime())) return null;
  return { politica_variante: v, politica_hash: h, politica_aceptada_at: new Date(at).toISOString() };
}
