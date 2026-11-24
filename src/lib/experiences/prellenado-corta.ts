// EL FLYER LLENA EL ALTA RÁPIDA (23 nov 2026).
//
// Luis, armando una experiencia como operadora: «hay que incluir la sección de
// IA, en donde suban su flyer y les pre-llene la experiencia». El editor
// completo ya lo tenía (`lib/ai/prellenar.ts`, 134 campos, uno a tres minutos);
// el alta rápida pide 17 y merece una lectura a su medida: corta y rápida.
//
// Este archivo es la mitad PURA: toma lo que devolvió la IA y decide qué entra
// al formulario. La otra mitad (`lib/ai/prellenar-corta.ts`) es la llamada.
//
// ⚠️ TRES REGLAS, LAS MISMAS DEL PRE-LLENADO DE SIEMPRE:
//   1. NUNCA SE INVENTA. Lo que el material no dice llega vacío y vacío se
//      queda; aquí además se TIRA lo que no tenga la forma que el formulario
//      exige (una hora que no es hora, una actividad que no está en el
//      catálogo, un precio en letras). Preferible un campo vacío a uno falso.
//   2. NUNCA PISA LO ESCRITO. Sólo se llenan los campos que la persona dejó
//      vacíos: si ya escribió su precio, su precio manda.
//   3. SE DICE QUÉ SE LLENÓ Y QUÉ NO, con el nombre que el campo tiene en
//      pantalla, para que revise sabiendo dónde mirar.

import { ACTIVIDADES } from "@/lib/operadores/actividades";
import { normalizarEstado } from "@/lib/ai/aplicar-prellenado";
import { esExigencia, type ExperienciaCorta } from "./corta";

/** Lo que devuelve la IA, tal cual: todo texto, todo opcional. */
export type CortaDeIA = {
  titulo?: unknown;
  lugar?: unknown;
  estado?: unknown;
  actividad?: unknown;
  descripcion?: unknown;
  incluye?: unknown;
  noIncluye?: unknown;
  horaInicio?: unknown;
  horaTermino?: unknown;
  exigencia?: unknown;
  edadMinima?: unknown;
  precio?: unknown;
  cupo?: unknown;
  fechaInicio?: unknown;
  fechaFin?: unknown;
  puntoEncuentro?: unknown;
  notas?: unknown;
};

export type SalidaCorta = { inicio: string; fin: string; puntoEncuentro: string };

/** Cómo se llama cada campo EN PANTALLA: con estos nombres se le cuenta qué pasó. */
const NOMBRE: Record<string, string> = {
  titulo: "el nombre",
  lugar: "dónde es",
  estado: "el estado",
  actividad: "la actividad",
  descripcion: "de qué se trata",
  incluye: "qué incluye",
  noIncluye: "qué no incluye",
  horaInicio: "la hora de inicio",
  horaTermino: "la hora de término",
  exigencia: "qué tanto exige",
  edadMinima: "la edad mínima",
  precio: "el precio",
  cupo: "el cupo",
  fecha: "la primera fecha",
  puntoEncuentro: "el punto de encuentro",
};

/** Lo que el formulario exige para guardarse y la IA puede traer (la portada y las fotos no). */
const OBLIGATORIOS = ["titulo", "lugar", "estado", "actividad", "descripcion", "incluye", "horaInicio", "horaTermino", "exigencia", "edadMinima", "precio"] as const;

const SLUGS = new Set(ACTIVIDADES.map((a) => a.slug));
const texto = (v: unknown, max = 400): string => (typeof v === "string" ? v.replace(/[ \t]+/g, " ").trim().slice(0, max) : "");
const lista = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => texto(x, 160)).filter(Boolean).slice(0, 12) : [];

/** «7:30», «07:30 h», «7.30» → «07:30». Lo que no sea una hora, vacío. */
export function horaDe(v: unknown): string {
  const m = texto(v, 20).match(/^(\d{1,2})[:.](\d{2})/);
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** «$1,800 MXN», «1800.00» → «1800». Menos de $10 o sin número, vacío. */
export function pesosDe(v: unknown): string {
  const limpio = texto(v, 30).replace(/[$,\s]/g, "").replace(/mxn|pesos/gi, "");
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return "";
  const n = Math.round(Number(limpio));
  return n >= 10 ? String(n) : "";
}

const enteroDe = (v: unknown, min: number, max: number): string => {
  const t = texto(v, 10);
  if (!/^\d+$/.test(t)) return "";
  const n = Number(t);
  return n >= min && n <= max ? String(n) : "";
};

/** Una fecha AAAA-MM-DD que existe y no ha pasado. Si no, vacío. */
export function fechaDe(v: unknown, hoy: string): string {
  const t = texto(v, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  const d = new Date(`${t}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== t) return "";
  return t >= hoy ? t : "";
}

export type ResultadoPrellenado = {
  corta: ExperienciaCorta;
  salida: SalidaCorta;
  /** Los campos que se llenaron, con su nombre de pantalla. */
  llenados: string[];
  /** Los obligatorios que siguen vacíos después de llenar: hay que escribirlos. */
  faltan: string[];
  /** Lo que la IA dijo que no encontró o supuso. */
  notas: string;
};

/**
 * Mete al formulario lo que la IA leyó del flyer. Sólo en campos vacíos, sólo
 * con la forma correcta. `hoy` es AAAA-MM-DD (hora de México): una fecha que
 * ya pasó no se propone como primera salida.
 */
export function aplicarPrellenadoCorta(
  actual: ExperienciaCorta,
  salidaActual: SalidaCorta,
  ia: CortaDeIA,
  hoy: string,
): ResultadoPrellenado {
  const corta: ExperienciaCorta = { ...actual, incluye: [...actual.incluye], noIncluye: [...actual.noIncluye], fotos: [...actual.fotos] };
  const salida: SalidaCorta = { ...salidaActual };
  const llenados: string[] = [];

  const pon = (campo: "titulo" | "lugar" | "estado" | "actividad" | "descripcion" | "horaInicio" | "horaTermino" | "exigencia" | "edadMinima" | "precio" | "cupo", valor: string) => {
    if (!valor || corta[campo].trim()) return;
    corta[campo] = valor;
    llenados.push(NOMBRE[campo]);
  };

  pon("titulo", texto(ia.titulo, 90));
  pon("lugar", texto(ia.lugar, 120));
  pon("estado", normalizarEstado(texto(ia.estado, 60)));
  const actividad = texto(ia.actividad, 40);
  pon("actividad", SLUGS.has(actividad) ? actividad : "");
  // La descripción conserva sus saltos de párrafo: cada párrafo es un bloque de la página.
  pon("descripcion", typeof ia.descripcion === "string" ? ia.descripcion.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 1600) : "");
  pon("horaInicio", horaDe(ia.horaInicio));
  pon("horaTermino", horaDe(ia.horaTermino));
  const exigencia = texto(ia.exigencia, 12);
  pon("exigencia", esExigencia(exigencia) ? exigencia : "");
  pon("edadMinima", enteroDe(ia.edadMinima, 0, 99));
  pon("precio", pesosDe(ia.precio));
  pon("cupo", enteroDe(ia.cupo, 1, 500));

  // Las listas se llenan sólo si están vacías (el formulario nace con un renglón en blanco).
  for (const campo of ["incluye", "noIncluye"] as const) {
    const traidas = lista(ia[campo]);
    if (traidas.length && !corta[campo].some((x) => x.trim())) {
      corta[campo] = traidas;
      llenados.push(NOMBRE[campo]);
    }
  }

  // La primera fecha: sólo si no hay una puesta. El fin nunca antes del inicio.
  if (!salida.inicio) {
    const inicio = fechaDe(ia.fechaInicio, hoy);
    if (inicio) {
      salida.inicio = inicio;
      const fin = fechaDe(ia.fechaFin, hoy);
      salida.fin = fin && fin > inicio ? fin : "";
      llenados.push(NOMBRE.fecha);
      const punto = texto(ia.puntoEncuentro, 160);
      if (punto && !salida.puntoEncuentro.trim()) {
        salida.puntoEncuentro = punto;
        llenados.push(NOMBRE.puntoEncuentro);
      }
    }
  }

  const vacio = (campo: (typeof OBLIGATORIOS)[number]) =>
    campo === "incluye" ? !corta.incluye.some((x) => x.trim()) : !corta[campo].trim();
  const faltan = OBLIGATORIOS.filter(vacio).map((c) => NOMBRE[c]);

  return { corta, salida, llenados, faltan, notas: texto(ia.notas, 500) };
}
