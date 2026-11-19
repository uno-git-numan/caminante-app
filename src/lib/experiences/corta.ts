// EL ALTA RÁPIDA DE UNA EXPERIENCIA (19 nov 2026).
//
// El formulario completo tiene 17 secciones y 134 campos: mezcla lo que hace
// falta para VENDER con lo editorial. Luis: «Dar de alta una experiencia es
// gigante». Esto es la otra puerta: una lista corta de datos de la que sale una
// experiencia completa, con el mismo modelo de siempre (`Experience` +
// `page.blocks`), lista para publicarse. Lo editorial —itinerario día por día,
// guías, mochila, preguntas, ficha científica— se agrega después en el editor
// completo, si se quiere. Nada de eso es obligatorio para vender.
//
// Qué se pide lo decidió legal como mínimo de la oferta (D27): lo que es, dónde,
// qué incluye y qué no, cuándo empieza y termina, cuánto exige, desde qué edad,
// cuánto cuesta y cómo se cancela.
//
// Qué se pone solo: el contacto de quien la crea, la encuesta estándar, el
// deslinde con las cláusulas que se le pasen, los títulos de cada bloque de la
// página y —sólo cuando la salida de verdad lleva póliza— el renglón del
// seguro de accidentes.
//
// Puro: lo usan la pantalla (para decir qué falta mientras se escribe), la
// acción que guarda y las pruebas.

import { emptyExperience, slugify, type ContactoDueno } from "./empty";
import { buildBlocks, emptyV2Draft } from "./page-v2";
import type { Experience } from "./types";
import type { ClausulaGuardada } from "@/lib/legal/clausulas";
import { esVariante, type Variante } from "@/lib/cancelacion/politica";

/** Cuánto exige la salida. Lista corta, en palabras de quien va a ir. */
export const EXIGENCIA = {
  baja: { nombre: "Baja", detalle: "Para cualquier persona con salud normal. Caminata corta o actividad tranquila." },
  media: { nombre: "Media", detalle: "Hace falta algo de condición: varias horas de actividad o terreno irregular." },
  alta: { nombre: "Alta", detalle: "Hace falta buena condición y experiencia previa: jornadas largas, altura o desnivel fuerte." },
  "muy-alta": { nombre: "Muy alta", detalle: "Sólo con entrenamiento y experiencia comprobable en esta actividad." },
} as const;
export type Exigencia = keyof typeof EXIGENCIA;
export const esExigencia = (x: unknown): x is Exigencia => typeof x === "string" && x in EXIGENCIA;

/** Los datos de la oferta que la ley pide tener a la vista (D27). Viven en `Experience.datosOferta`. */
export type DatosOferta = {
  /** «07:00» */
  horaInicio: string;
  /** «18:00». En salidas de varios días, la hora en que termina el último. */
  horaTermino: string;
  exigencia: Exigencia;
  /** Años cumplidos. 0 = sin mínimo. */
  edadMinima: number;
};

export type ExperienciaCorta = {
  titulo: string;
  /** Dónde es, como lo diría quien invita: «Paso de Cortés, Amecameca». */
  lugar: string;
  /** Estado de México: liga la experiencia con su página de destino. */
  estado: string;
  /** Slug del catálogo de actividades (`lib/operadores/actividades.ts`). */
  actividad: string;
  /** De qué se trata, en uno o dos párrafos. */
  descripcion: string;
  portada: string;
  /** Hasta cinco fotos más. */
  fotos: string[];
  incluye: string[];
  noIncluye: string[];
  horaInicio: string;
  horaTermino: string;
  exigencia: string;
  edadMinima: string;
  /** Precio por persona, en pesos, con IVA. */
  precio: string;
  /** Cuántas personas caben. Vacío = sin tope. */
  cupo: string;
  politica: string;
};

export const CORTA_VACIA: ExperienciaCorta = {
  titulo: "",
  lugar: "",
  estado: "",
  actividad: "",
  descripcion: "",
  portada: "",
  fotos: [],
  incluye: [""],
  noIncluye: [""],
  horaInicio: "",
  horaTermino: "",
  exigencia: "",
  edadMinima: "",
  precio: "",
  cupo: "",
  politica: "estandar",
};

/**
 * El renglón que el sistema agrega a «Incluye» cuando la salida lleva póliza
 * de accidentes. Sigue la misma variante que la cláusula 9 del deslinde (D28,
 * que corrigió a D27): aparece «con seguro» y no aparece «sin seguro». Una
 * página que promete un seguro que no existe es peor que una que no dice nada.
 */
export const RENGLON_SEGURO = "Seguro de accidentes durante la salida";

const limpio = (s: string | undefined | null) => (s ?? "").trim();
const lista = (xs: string[] | undefined) => (xs ?? []).map(limpio).filter(Boolean);
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const entero = (s: string) => (/^\d+$/.test(limpio(s)) ? Number(limpio(s)) : NaN);
const pesos = (s: string) => Number(limpio(s).replace(/[$,\s]/g, ""));

export type FaltanteDeCorta = { campo: keyof ExperienciaCorta; mensaje: string };

/**
 * Qué le falta al alta rápida para poder guardarse, en palabras. Vacío = lista.
 * Una sola lista, en el orden de la pantalla: se enseña junta en vez de ir
 * rebotando a la persona de error en error.
 */
export function faltantesDeCorta(c: ExperienciaCorta): FaltanteDeCorta[] {
  const f: FaltanteDeCorta[] = [];
  const falta = (campo: keyof ExperienciaCorta, mensaje: string) => f.push({ campo, mensaje });

  if (!limpio(c.titulo)) falta("titulo", "Ponle nombre a la experiencia.");
  else if (!slugify(c.titulo)) falta("titulo", "El nombre necesita al menos una letra o un número.");
  if (!limpio(c.lugar)) falta("lugar", "Di dónde es.");
  if (!limpio(c.estado)) falta("estado", "Elige el estado de la República.");
  if (!limpio(c.actividad)) falta("actividad", "Elige qué actividad es.");
  if (limpio(c.descripcion).length < 40) falta("descripcion", "Cuenta de qué se trata, en un par de renglones.");
  if (!limpio(c.portada)) falta("portada", "Sube la foto de portada.");
  if (!lista(c.incluye).length) falta("incluye", "Di qué incluye.");
  if (!HORA.test(limpio(c.horaInicio))) falta("horaInicio", "Pon la hora en que empieza.");
  if (!HORA.test(limpio(c.horaTermino))) falta("horaTermino", "Pon la hora en que termina.");
  if (!esExigencia(c.exigencia)) falta("exigencia", "Elige qué tanto exige.");
  const edad = entero(c.edadMinima);
  if (!Number.isInteger(edad) || edad > 99) falta("edadMinima", "Pon la edad mínima (0 si no hay).");
  const precio = pesos(c.precio);
  if (!(precio >= 10)) falta("precio", "Pon el precio por persona.");
  if (limpio(c.cupo) && !(entero(c.cupo) >= 1)) falta("cupo", "El cupo es un número de personas (o déjalo vacío si no hay tope).");
  if (!esVariante(c.politica)) falta("politica", "Elige la política de cancelación.");
  return f;
}

/** «07:00» → «7:00» */
const horaCorta = (h: string) => h.replace(/^0/, "");

/** Los datos de la oferta en un renglón, para la ficha: «De 7:00 a 18:00 · Exigencia media · Desde 12 años». */
export function renglonesDeOferta(d: DatosOferta | null | undefined): string[] {
  if (!d || !esExigencia(d.exigencia)) return [];
  const out: string[] = [];
  if (HORA.test(d.horaInicio) && HORA.test(d.horaTermino)) out.push(`De ${horaCorta(d.horaInicio)} a ${horaCorta(d.horaTermino)} h`);
  out.push(`Exigencia ${EXIGENCIA[d.exigencia].nombre.toLowerCase()}`);
  out.push(d.edadMinima > 0 ? `Desde ${d.edadMinima} años` : "Sin edad mínima");
  return out;
}

/** Lee `datosOferta` de una experiencia guardada; null si no los trae completos. */
export function datosOfertaDe(exp: { datosOferta?: Partial<DatosOferta> | null } | null | undefined): DatosOferta | null {
  const d = exp?.datosOferta;
  if (!d || !esExigencia(d.exigencia) || typeof d.horaInicio !== "string" || typeof d.horaTermino !== "string") return null;
  const edad = Number(d.edadMinima);
  return { horaInicio: d.horaInicio, horaTermino: d.horaTermino, exigencia: d.exigencia, edadMinima: Number.isInteger(edad) && edad >= 0 ? edad : 0 };
}

/** Las primeras frases de un texto, hasta `max` caracteres, sin cortar a media frase. */
function primerasFrases(texto: string, max: number): string {
  const t = limpio(texto).replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const frases = t.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = "";
  for (const fr of frases) {
    if ((out + fr).length > max) break;
    out += fr;
  }
  return limpio(out) || `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/**
 * La experiencia completa que sale del alta rápida. Nace en BORRADOR: publicar
 * sigue pasando por los candados de siempre.
 *
 * `clausulas` = el resumen del deslinde que se le pone. El texto es de legal,
 * no se redacta aquí; si llega vacío, el deslinde nace apagado y publicar lo
 * va a pedir (no se inventa una cláusula para que pase el candado).
 */
export function experienciaDesdeCorta(
  c: ExperienciaCorta,
  opts: {
    dueno?: ContactoDueno;
    clausulas?: ClausulaGuardada[];
    /** ¿La salida lleva póliza de accidentes? Es un hecho (operadora con convenio firmado), no una preferencia. */
    conSeguro?: boolean;
  } = {},
): Experience {
  const titulo = limpio(c.titulo);
  const lugar = limpio(c.lugar);
  const descripcion = limpio(c.descripcion);
  const precio = pesos(c.precio);
  const precioTxt = `$${Math.round(precio).toLocaleString("en-US")}`;
  const cupo = limpio(c.cupo) ? entero(c.cupo) : null;
  const fotos = lista(c.fotos).slice(0, 5);
  const incluye = lista(c.incluye);
  const yes = opts.conSeguro && !incluye.some((x) => /seguro/i.test(x)) ? [...incluye, RENGLON_SEGURO] : incluye;
  const parrafos = descripcion.split(/\n{2,}|\n/).map(limpio).filter(Boolean);
  const clausulas = opts.clausulas ?? [];

  const base = emptyExperience(opts.dueno);
  const exp: Experience = {
    ...base,
    slug: slugify(titulo),
    status: "draft",
    estado: limpio(c.estado),
    actividad: limpio(c.actividad) || null,
    title: titulo,
    titleAccent: "",
    subtitle: primerasFrases(descripcion, 220),
    heroImageUrl: limpio(c.portada),
    heroImageAlt: titulo,
    cardTitle: titulo,
    cardPloc: lugar,
    cardHook: primerasFrases(descripcion, 120),
    docTitle: `${titulo} — Caminante`,
    edgeLabel: `Caminante · ${titulo}`,
    footerBrand: `Caminante · ${titulo}`,
    price: { amount: String(Math.round(precio)), currency: "MXN · por persona", desc: "" },
    ...(cupo ? { capacity: cupo } : {}),
    politicaCancelacion: esVariante(c.politica) ? (c.politica as Variante) : undefined,
    datosOferta: {
      horaInicio: limpio(c.horaInicio),
      horaTermino: limpio(c.horaTermino),
      exigencia: c.exigencia as Exigencia,
      edadMinima: entero(c.edadMinima) || 0,
    },
    registration: {
      ...(base.registration as NonNullable<Experience["registration"]>),
      active: clausulas.length > 0,
      waiverClauses: clausulas,
      // Una experiencia nueva nace con el marco corregido del documento (D28 §3).
      marco: 2,
    },
    feedback: {
      ...(base.feedback as NonNullable<Experience["feedback"]>),
      active: true,
      locationLabel: lugar,
    },
  };

  const v2 = emptyV2Draft(exp);
  v2.hero = { eyebrow: "", metaEst: lugar, title: titulo, titleAccent: "", sub: exp.subtitle, bg: { url: exp.heroImageUrl, alt: titulo } };
  v2.experiencia = {
    ...v2.experiencia,
    title: "Lo que vas a",
    titleAccent: "vivir.",
    // Cada párrafo de la descripción es un punto; así no hay que escribirla dos veces.
    points: parrafos.length ? parrafos.slice(0, 4) : [descripcion],
    // El mosaico se arma con 3 o 4 fotos; con menos, la sección va sin fotos.
    mosaic: (fotos.length >= 4 ? fotos.slice(0, 4) : fotos.length === 3 ? fotos : []).map((url) => ({ url, alt: titulo })),
  };
  v2.itinerary = { ...v2.itinerary, on: false };
  v2.tariff = {
    ...v2.tariff,
    title: "Tu",
    titleAccent: "lugar.",
    tier: "Por persona",
    price: precioTxt,
    priceCur: "MXN · por persona",
    availK: cupo ? "Cupo" : "",
    availV: cupo ? `${cupo} personas` : "",
  };
  v2.checklist = { ...v2.checklist, yesItems: yes, noItems: lista(c.noIncluye) };
  v2.packing = { ...v2.packing, on: false };

  exp.design = "v2";
  exp.page = { docTitle: exp.docTitle, blocks: buildBlocks(v2) };
  return exp;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/**
 * La etiqueta de una salida a partir de sus fechas (YYYY-MM-DD), como las que
 * ya se usan en Salidas: «Dic 12», «Dic 12-13», «Nov 30 - Dic 2». Sin `Date`,
 * para que un huso horario no mueva el día.
 */
export function etiquetaDeSalida(inicio: string, fin: string): string {
  const [, mi, di] = inicio.split("-").map(Number);
  const [, mf, df] = (fin || inicio).split("-").map(Number);
  if (!fin || fin === inicio) return `${MESES[mi - 1]} ${di}`;
  return mi === mf ? `${MESES[mi - 1]} ${di}-${df}` : `${MESES[mi - 1]} ${di} - ${MESES[mf - 1]} ${df}`;
}
