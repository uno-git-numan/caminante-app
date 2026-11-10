// LOS DATOS FISCALES DE LA OPERADORA SALEN DE SU CONSTANCIA. No se teclean.
//
// Luis, 9 nov 2026: «Me parece bien que los datos fiscales salgan de la
// constancia y no pidamos.» El alta tiene que ser tan rápida como abrir una
// cuenta de Revolut; un dato que ya viene en un documento no se vuelve a pedir.
//
// Para que NUMAN le facture su comisión (CFDI 4.0) hacen falta cuatro datos del
// receptor, y el SAT exige que coincidan con su constancia: RFC, nombre o
// razón social, régimen y código postal. Leerlos de la constancia no es un
// atajo: es la fuente que el SAT usa para validar el CFDI.
//
// ⚠️ SÓLO DE UNA CONSTANCIA QUE EL SAT CONFIRMÓ. La IA lee; el SAT confirma
// (ver csf.ts). Una constancia editada puede engañar a la lectura, no al
// validador del SAT: sin `sat === "validada"` no se escribe nada.
//
// Este archivo es puro (sin base ni red) para poder probar cada regla.

import { tipoPersonaDeRfc } from "@/lib/facturacion/catalogos";
import type { AnalisisCsf } from "./csf";

/**
 * c_RegimenFiscal por el NOMBRE con que la constancia lo escribe. La IA copia
 * el nombre tal cual («Régimen de las Personas Físicas con Actividades
 * Empresariales y Profesionales»); la clave la pone este mapa, no la IA. El
 * orden importa: lo más específico primero.
 */
const POR_NOMBRE: [RegExp, string][] = [
  [/plataformas tecnol/, "625"],
  [/simplificado de confianza/, "626"],
  [/actividades empresariales y profesionales/, "612"],
  [/general de ley/, "601"],
  [/fines no lucrativos/, "603"],
  [/sueldos y salarios/, "605"],
  [/arrendamiento/, "606"],
  [/enajenacion o adquisicion de bienes/, "607"],
  [/demas ingresos/, "608"],
  [/residentes en el extranjero/, "610"],
  [/dividendos/, "611"],
  [/intereses/, "614"],
  [/premios/, "615"],
  [/sin obligaciones fiscales/, "616"],
  [/cooperativas de produccion/, "620"],
  [/incorporacion fiscal/, "621"],
  [/agricolas|ganaderas|silvicolas|pesqueras/, "622"],
  [/grupos de sociedades/, "623"],
  [/coordinados/, "624"],
];

const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ");

/** La clave SAT de un régimen leído. `null` si no se reconoce: no se adivina. */
export function claveDeRegimen(nombre: string): string | null {
  const t = sinAcentos(nombre);
  const clave = t.match(/\b(6\d\d)\b/)?.[1];
  if (clave && POR_NOMBRE.some(([, c]) => c === clave)) return clave;
  return POR_NOMBRE.find(([re]) => re.test(t))?.[1] ?? null;
}

/**
 * Los regímenes con los que se puede facturar un servicio turístico. Los de
 * sueldos, arrendamiento, dividendos, intereses… existen en la constancia de
 * una persona física pero no son con los que opera: no se usan para la factura
 * de la comisión.
 */
const DE_NEGOCIO = new Set(["601", "603", "612", "620", "621", "622", "623", "624", "625", "626"]);

export type DatosFiscales = {
  rfc: string;
  razonSocial: string;
  cp: string;
  tipoPersona: "fisica" | "moral";
  /** Todos los regímenes de negocio de la constancia, en clave SAT. */
  regimenes: string[];
  /**
   * El régimen con que se factura. Sólo se decide solo cuando hay UNO de
   * negocio. Con varios (p. ej. 612 y 625) queda `null`: cuál va en el CFDI es
   * una pregunta abierta a la sesión legal y fiscal, y no se adivina.
   */
  regimen: string | null;
};

export type ResultadoFiscal = { ok: true; datos: DatosFiscales } | { ok: false; porque: string };

/** Lo que se puede tomar de una constancia leída. Nunca completa un dato que falte. */
export function datosFiscalesDeCsf(a: AnalisisCsf | null | undefined): ResultadoFiscal {
  if (!a) return { ok: false, porque: "Todavía no se lee la constancia." };
  if (a.error) return { ok: false, porque: a.error };
  if (a.esConstancia === false) return { ok: false, porque: "El archivo no es una Constancia de Situación Fiscal." };
  if (a.sat !== "validada") return { ok: false, porque: "El SAT todavía no confirma la constancia." };
  const rfc = (a.rfc ?? "").trim().toUpperCase();
  const tipoPersona = tipoPersonaDeRfc(rfc);
  if (!tipoPersona) return { ok: false, porque: "El RFC de la constancia no tiene forma de RFC." };
  if (a.estatus && !/activo/i.test(a.estatus)) {
    return { ok: false, porque: `El SAT la tiene como «${a.estatus}», no como activa.` };
  }
  const razonSocial = (a.nombre ?? "").trim();
  if (!razonSocial) return { ok: false, porque: "No se leyó el nombre o la razón social." };
  const cp = (a.codigoPostal ?? "").trim();
  if (!/^\d{5}$/.test(cp)) return { ok: false, porque: "No se leyó el código postal." };

  const regimenes = [...new Set(a.regimenes.map(claveDeRegimen).filter((c): c is string => !!c && DE_NEGOCIO.has(c)))];
  return {
    ok: true,
    datos: { rfc, razonSocial, cp, tipoPersona, regimenes, regimen: regimenes.length === 1 ? regimenes[0] : null },
  };
}

/** La fila de `operators` como está antes de escribir. */
export type FiscalActual = { rfc: string | null; tipo_persona: string | null };

/**
 * Qué se escribe en `operators`. Reglas:
 * - Si ya había un RFC y es OTRO, no se toca nada: puede ser la constancia de
 *   otra persona, y eso lo decide quien revisa (el aviso ya sale en pantalla).
 * - `regimen_fiscal` sólo se escribe cuando es uno; con varios se deja como
 *   estaba.
 * - `tipo_persona` lo dice el RFC, que confirmó el SAT: pesa más que el botón.
 */
export function cambiosFiscales(
  d: DatosFiscales,
  actual: FiscalActual,
): { escribir: Record<string, string>; motivo: string | null } {
  const rfcActual = (actual.rfc ?? "").trim().toUpperCase();
  if (rfcActual && rfcActual !== d.rfc) {
    return { escribir: {}, motivo: `La constancia es del RFC ${d.rfc} y la operadora tiene ${rfcActual}.` };
  }
  const escribir: Record<string, string> = {
    rfc: d.rfc,
    razon_social: d.razonSocial,
    cp_fiscal: d.cp,
    tipo_persona: d.tipoPersona,
  };
  if (d.regimen) escribir.regimen_fiscal = d.regimen;
  return { escribir, motivo: null };
}
