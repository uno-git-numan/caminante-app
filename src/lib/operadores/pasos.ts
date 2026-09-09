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
  /** Los dos momentos del paso, en orden. */
  momentos: [string, string];
};

export const PASOS: Paso[] = [
  { n: "01", titulo: "Nos conocemos", resumen: "Una llamada de media hora. No te pedimos nada más.",
    momentos: ["Solicitud recibida", "Llamada agendada"] },
  { n: "02", titulo: "Tu expediente", resumen: "Los documentos de tu operación, en el orden que quieras.",
    momentos: ["Pendiente", "En revisión"] },
  { n: "03", titulo: "El convenio", resumen: "Una firma. Es lo único que bloquea todo lo demás.",
    momentos: ["Por firmar", "Firmado"] },
  { n: "04", titulo: "Armar y cobrar", resumen: "Tu experiencia y tu cobro, al mismo tiempo y sin orden.",
    momentos: ["Armando, sin cobrar", "Vendiendo"] },
];

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
