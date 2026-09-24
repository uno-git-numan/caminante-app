// LOS SIETE ESTADOS, CONTADOS EN CUATRO PASOS.
//
// `mi-alta.ts` deduce siete estados porque son siete situaciones distintas de
// operar. La lámina de Claude Design (Operador Mi Alta v5) los cuenta en CUATRO
// pasos con dos momentos cada uno, y tiene razón: al que está esperando no le
// sirve saber que existe una diferencia entre «expediente» y «revisión» —le
// sirve saber que va en el paso 2 de 4 y que la pelota ya no es suya.
//
// El mapa vive aquí, puro, y no dentro de la pantalla: es la traducción entre
// lo que el sistema sabe y lo que la persona lee.

import type { EstadoAlta } from "./mi-alta";

export type Paso = {
  n: "01" | "02" | "03" | "04";
  titulo: string;
  resumen: string;
  /** Lo que dice el paso cuando ya se cerró (lámina «Panel Operadora»). */
  cerrado: string;
};

// ⚠️ LA LÁMINA NUEVA («Panel Operadora», 24 sep 2026) QUITÓ LOS MOMENTOS del
// riel. Cada paso llevaba dos pastillas —«Solicitud recibida», «Llamada
// agendada»…— y ahora lleva UNA línea de estado: lo que pasó si ya se cerró,
// «Aquí estás» si es el actual y «Todavía no · puedes verlo» si viene. Los
// textos se copiaron del archivo de la lámina con un script.
export const PASOS: Paso[] = [
  { n: "01", titulo: "Nos conocemos", resumen: "Una llamada de media hora.", cerrado: "Llamada hecha" },
  { n: "02", titulo: "Tu expediente", resumen: "Lo general una vez, y una carpeta por actividad.", cerrado: "Expediente aprobado" },
  { n: "03", titulo: "El convenio", resumen: "Una firma. Es lo único que bloquea todo lo demás.", cerrado: "Firmado" },
  { n: "04", titulo: "Armar y cobrar", resumen: "Tu experiencia y tu cobro, al mismo tiempo.", cerrado: "Vendiendo" },
];

/** «Firmado el …» cuando se sabe la fecha de firma. */
export const FIRMADO_EL = "Firmado el ";
/** La línea del paso actual y la de los que vienen. */
export const AQUI_ESTAS = "Aquí estás";
export const TODAVIA_NO = "Todavía no · puedes verlo";

/** Lo que se lee al asomarse a un paso que todavía no toca (el 01 no tiene: siempre enseña su contenido). */
export const LECTURA_PASO: Record<1 | 2 | 3, string> = {
  1: "Aquí te vamos a pedir papeles de tu operación: diez generales que sirven para todo, y una carpeta por cada actividad que quieras ofrecer. Se abre después de la llamada.",
  2: "Aquí vas a leer el convenio completo y firmarlo. Es lo único de todo el camino que bloquea lo que viene: al firmarlo se abre tu catálogo el mismo día. Se habilita cuando tu expediente tenga al menos una actividad aprobada.",
  3: "Aquí armas tu experiencia y conectas tu cobro, en el orden que se te dé la gana: no se bloquean entre sí. Se abre en cuanto firmes el convenio.",
};

/** En qué paso va, y en cuál de sus dos momentos (0 o 1). */
export function pasoDe(estado: EstadoAlta): { indice: number; momento: 0 | 1 } {
  switch (estado) {
    case "recibida":    return { indice: 0, momento: 0 };
    case "llamada":     return { indice: 0, momento: 1 };
    case "expediente":  return { indice: 1, momento: 0 };
    case "revision":    return { indice: 1, momento: 1 };
    case "por_firmar":  return { indice: 2, momento: 0 };
    case "armando":     return { indice: 3, momento: 0 };
    case "listo":       return { indice: 3, momento: 1 };
    // Rechazada y suspendida NO son pasos del recorrido: son salidas. La
    // pantalla las trata aparte; aquí se devuelve el primero para no romper el
    // riel si alguien las manda por error.
    default:            return { indice: 0, momento: 0 };
  }
}
