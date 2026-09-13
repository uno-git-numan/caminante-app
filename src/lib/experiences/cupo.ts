// EL CUPO TIENE UN SOLO HOGAR.
//
// Cuántas personas caben es un dato del que dependen dos cosas distintas: lo que
// el SISTEMA permite vender (`availability.ts` lee `data.capacity` como tope
// estándar) y lo que la PÁGINA le promete al viajero. Hasta hoy eran dos datos
// separados: el número real en `data.capacity`, y un texto libre —«16 personas»—
// escrito a mano en el bloque de tarifa y otra vez, aparte, dentro de la línea
// de precios del bloque de fechas.
//
// Tres lugares para el mismo hecho es una promesa que se rompe sola, y ya se
// rompió: el 13 sep 2026, en producción y publicada, «El fondo de la barranca»
// anunciaba **11 personas** en la tarifa y **cupo 12 personas** cuatro secciones
// más abajo. Nadie mintió: alguien corrigió un número y no supo que había otro.
// Y casi ninguna experiencia tenía `data.capacity`, así que el número que el
// sitio anunciaba no lo conocía el sistema que vende.
//
// Desde aquí el cupo sale de UN campo, `data.capacity`, y todo lo que lo enseña
// lo DERIVA. El texto libre deja de poder decirlo — el invariante #19 tumba el
// build si vuelve a aparecer escrito a mano.

import type { Experience } from "./types";

/** El cupo de la experiencia. `null` = no se ha definido, que NO es cero. */
export function cupoDe(exp: Pick<Experience, "capacity"> | null | undefined): number | null {
  const n = exp?.capacity;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/** Cómo se lee en pantalla. `null` cuando no hay cupo: mejor callar que inventar. */
export function textoDeCupo(n: number | null): string | null {
  if (n === null) return null;
  return `${n} ${n === 1 ? "persona" : "personas"}`;
}

/**
 * ¿Este texto está anunciando un cupo a mano?
 *
 * Lo usa el guardián de invariantes y el formulario. Busca la palabra pegada a
 * un número —«cupo 16», «cupo: 16 personas»— y no el uso suelto («cupo
 * limitado»), que no promete ninguna cifra y por lo tanto no puede contradecir.
 */
export const CUPO_ESCRITO_A_MANO = /\bcupos?\b[^.\n]{0,12}?\d/i;

/**
 * Quita el segmento del cupo de una línea separada por «·».
 *
 * La línea de precios de las fechas es texto de autor —«$13,500 MXN · habitación
 * compartida · cupo 16 personas»— y el cupo viajaba adentro. Se saca el
 * segmento entero, no el número: dejar «cupo » colgando sería peor.
 */
export function sinCupo(linea: string): string {
  return linea
    .split("·")
    .map((s) => s.trim())
    .filter((s) => s && !CUPO_ESCRITO_A_MANO.test(s))
    .join(" · ");
}
