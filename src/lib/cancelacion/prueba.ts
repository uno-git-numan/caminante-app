import "server-only";

// LA PRUEBA DE LA POLÍTICA QUE ACEPTÓ EL CLIENTE (D23 de legal, §3; 0089).
//
// No hay casilla: el texto está a la vista antes de pagar y junto al botón dice
// «Al pagar aceptas la política de cancelación de esta experiencia». Lo que
// queda como prueba, en cada reserva: la variante, la huella sha-256 del texto
// que se le mostró y la fecha en que se creó el cobro. Si el texto cambia
// después, cada reserva conserva el que aceptó.

import { createHash } from "node:crypto";
import { esVariante, textoPolitica, type ClausulaMinimo, type Variante } from "@/lib/cancelacion/politica";

export type PruebaDePolitica = {
  politica_variante: Variante;
  politica_hash: string;
  politica_aceptada_at: string;
  /**
   * La cláusula de cupo mínimo que vio (D26 §7.4): COPIA del mínimo y de la
   * fecha, no referencia a la salida. La huella cubre el texto con los dos ya
   * escritos. Sin estos dos campos la reserva no tiene la cláusula.
   */
  clausula_minimo?: number;
  clausula_limite?: string;
};

/**
 * La prueba para una experiencia con esa variante; null si no tiene política
 * elegida. `clausula` es la de la salida que se está pagando, si la tiene activa.
 */
export function pruebaDePolitica(variante: unknown, clausula: ClausulaMinimo | null = null, ahora = new Date()): PruebaDePolitica | null {
  if (!esVariante(variante)) return null;
  return {
    politica_variante: variante,
    politica_hash: createHash("sha256").update(textoPolitica(variante, clausula), "utf8").digest("hex"),
    politica_aceptada_at: ahora.toISOString(),
    ...(clausula ? { clausula_minimo: clausula.minimo, clausula_limite: clausula.limite } : {}),
  };
}

/** La prueba que viajó en la metadata del cobro (la caja web la manda; el webhook la escribe). */
export function pruebaDeMetadata(md: Record<string, string | undefined> | null | undefined): PruebaDePolitica | null {
  const v = md?.politica_variante;
  const h = md?.politica_hash ?? "";
  const at = md?.politica_aceptada_at ?? "";
  if (!esVariante(v) || !/^[0-9a-f]{64}$/.test(h) || !Number.isFinite(new Date(at).getTime())) return null;
  // La cláusula viaja como dos textos; sólo vale completa y bien formada.
  const minimo = Number(md?.clausula_minimo ?? "");
  const limite = md?.clausula_limite ?? "";
  const conClausula = Number.isInteger(minimo) && minimo >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(limite);
  return {
    politica_variante: v,
    politica_hash: h,
    politica_aceptada_at: new Date(at).toISOString(),
    ...(conClausula ? { clausula_minimo: minimo, clausula_limite: limite } : {}),
  };
}

/** La prueba lista para la metadata del cobro: ahí todo viaja como texto. */
export function pruebaComoMetadata(p: PruebaDePolitica | null): Record<string, string> {
  if (!p) return {};
  return {
    politica_variante: p.politica_variante,
    politica_hash: p.politica_hash,
    politica_aceptada_at: p.politica_aceptada_at,
    ...(p.clausula_minimo != null && p.clausula_limite ? { clausula_minimo: String(p.clausula_minimo), clausula_limite: p.clausula_limite } : {}),
  };
}
