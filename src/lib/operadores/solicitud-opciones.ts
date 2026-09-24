// LAS OPCIONES DE LA SOLICITUD DE OPERADORA — códigos y palabras, en un lugar.
//
// Hasta el 24 sep 2026 vivían en TRES lados, y dos decían distinto:
//   · el formulario de aplicar, con sus palabras («Montaña y senderismo»),
//   · la validación del servidor, sólo los códigos,
//   · la tarjeta de la casa, con OTRAS palabras («Montaña», «Vence pronto»).
// Al pintar en Mi alta «tu solicitud, como la escribiste», la operadora habría
// leído una palabra que no eligió. Aquí va la que eligió: la del formulario.
//
// Puro y sin servidor: lo importan el formulario y los paneles, que son
// componentes de navegador.

export type Opcion = { v: string; t: string };

export const TIPOS: Opcion[] = [
  { v: "montana", t: "Montaña y senderismo" },
  { v: "mar", t: "Mar y buceo" },
  { v: "cuevas", t: "Cuevas y cañones" },
  { v: "naturaleza", t: "Naturaleza y observación" },
  { v: "cultura", t: "Cultura y comunidades" },
  { v: "mixta", t: "Mixta" },
];
export const ANTIGUEDAD: Opcion[] = [
  { v: "menos-1", t: "Menos de 1 año" },
  { v: "1-3", t: "1–3 años" },
  { v: "3-10", t: "3–10 años" },
  { v: "mas-10", t: "Más de 10" },
];
export const SEGURO: Opcion[] = [
  { v: "vigente", t: "Sí, vigente" },
  { v: "vence-pronto", t: "Sí, pero vence pronto" },
  { v: "tramite", t: "En trámite" },
  { v: "no", t: "No" },
];
export const PRIMEROS: Opcion[] = [
  { v: "todos", t: "Todos certificados" },
  { v: "algunos", t: "Algunos" },
  { v: "botiquin", t: "No, pero llevamos botiquín" },
  { v: "no", t: "No" },
];

/** Los códigos válidos, para que el servidor rechace lo que no existe. */
export const codigos = (l: Opcion[]) => new Set(l.map((o) => o.v));

/**
 * La palabra de un código. Si el código no está en la lista (una solicitud
 * vieja, un valor que se retiró), se enseña el código tal cual en vez de un
 * hueco: un dato raro se ve, un dato vacío se esconde.
 */
export function etiqueta(l: Opcion[], v: string | null | undefined): string | null {
  if (!v) return null;
  return l.find((o) => o.v === v)?.t ?? v;
}
