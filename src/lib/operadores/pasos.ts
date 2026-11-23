// EL ALTA, EN CINCO PASOS — Y EN EL ORDEN EN QUE DAN GANAS DE HACERLA.
//
// Luis, 23 nov 2026, recorriendo el alta como operadora: «Deberíamos de poder
// avanzar más con este onboarding: avanzar al tema de logo, marca, colores,
// luego pasar a dar de alta experiencia (darles un taste chingón de la página),
// y al final [la cuenta de cobro]. Un tipo de freemium.»
//
// Hasta ese día eran cuatro —nos conocemos, expediente, convenio, armar y
// cobrar— y lo primero que veía una operadora era una lista de papeles; armar
// su experiencia estaba cerrado hasta firmar. Ahora lo primero es LO SUYO:
//
//   01  Tu marca            su logo y sus colores
//   02  Tu experiencia      la arma y ve cómo queda su página
//   03  Tus documentos      dos para vender (el resto, antes de la 1ª salida)
//   04  El convenio         una firma
//   05  Tu cuenta de cobro  donde recibe su dinero; con eso empieza a vender
//
// ARMAR ES LIBRE; VENDER PIDE LO DEMÁS. La operadora nunca le paga a Caminante:
// sólo la comisión por venta. PUBLICAR pide los dos documentos, el anexo y la
// firma del convenio; COBRAR pide además la cuenta. Eso lo vigila la puerta
// única (`candados-venta.ts`), que ganó la regla que antes cumplía el menú
// cerrado: una operadora no se publica sola sin convenio.
//
// Los pasos NO son una fila india: cada uno se puede abrir y hacer cuando sea,
// y cada uno sabe solo si ya está hecho. «Aquí estás» es el primero que falta.
// La llamada dejó de ser un paso: es algo que a veces pasa antes de entrar.
//
// Puro: es la traducción entre lo que el sistema sabe y lo que la persona lee.

import type { EstadoAlta } from "./mi-alta";

export type Paso = {
  n: "01" | "02" | "03" | "04" | "05";
  titulo: string;
  resumen: string;
  /** Lo que dice el paso cuando ya está hecho. */
  cerrado: string;
};

export const PASOS: Paso[] = [
  { n: "01", titulo: "Tu marca", resumen: "Tu logo y tus colores.", cerrado: "Lista" },
  { n: "02", titulo: "Tu experiencia", resumen: "Ármala y mira cómo queda tu página.", cerrado: "Armada" },
  { n: "03", titulo: "Tus documentos", resumen: "Dos para vender. Lo demás, antes de tu primera salida.", cerrado: "Aprobados" },
  { n: "04", titulo: "El convenio", resumen: "Una firma.", cerrado: "Firmado" },
  { n: "05", titulo: "Tu cuenta de cobro", resumen: "Donde recibes tu dinero. Con eso empiezas a vender.", cerrado: "Vendiendo" },
];

/** «Firmado el …» cuando se sabe la fecha de firma. */
export const FIRMADO_EL = "Firmado el ";
/** La línea del paso actual y la de los que faltan. */
export const AQUI_ESTAS = "Aquí estás";
export const PENDIENTE = "Pendiente";
/** La marca sin poner cuando ya siguió adelante: no es un pendiente, es una opción. */
export const OPCIONAL = "Opcional";

/** Lo mínimo del alta para saber qué pasos están hechos. */
export type ParaLosPasos = {
  estado: EstadoAlta;
  operadora: { marca: { completa: boolean }; puedeCobrar: boolean } | null;
  experiencias: { estado: string }[];
  expediente: { completo: boolean } | null;
  candados: { clave: string; cumplido: boolean }[];
};

/**
 * Cuáles de los cinco están hechos, cada uno por su cuenta. Dice la verdad de
 * cada uno: la marca está hecha sólo si está completa (la primera versión la
 * daba por «Lista» en cuanto había una experiencia, y la pantalla decía
 * «Lista» arriba y «te falta el logo» abajo).
 */
export function pasosHechos(d: ParaLosPasos): [boolean, boolean, boolean, boolean, boolean] {
  const conExperiencia = d.experiencias.length > 0;
  return [
    !!d.operadora?.marca.completa,
    conExperiencia,
    !!d.expediente?.completo,
    d.candados.find((c) => c.clave === "convenio")?.cumplido === true,
    !!d.operadora?.puedeCobrar,
  ];
}

/** La marca es opcional: sin ponerla, quien ya armó una experiencia siguió adelante. */
export function marcaSaltada(d: ParaLosPasos): boolean {
  return !d.operadora?.marca.completa && d.experiencias.length > 0;
}

/**
 * En cuál va: el primero que falta. `-1` mientras sigue en su solicitud (no
 * tiene panel todavía: no hay pasos que enseñarle). Con todo hecho, el último.
 * La marca saltada no la detiene en el 01.
 */
export function pasoActual(d: ParaLosPasos): number {
  if (!d.operadora) return -1;
  const saltada = marcaSaltada(d);
  const i = pasosHechos(d).findIndex((hecho, k) => !hecho && !(k === 0 && saltada));
  return i < 0 ? PASOS.length - 1 : i;
}

export const ORDINALES = ["primero", "segundo", "tercero", "cuarto", "quinto"] as const;
