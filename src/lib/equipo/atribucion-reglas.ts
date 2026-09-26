// LAS REGLAS DE LA ATRIBUCIÓN (0071) — puro, sin servidor, para pantallas y pruebas.
//
// Qué se atribuye, quién puede tenerlo, y cómo se lee el libro. Lo que toca
// la base vive en `atribucion.ts`; aquí sólo hay decisiones.

import type { Facultad } from "@/lib/equipo/facultades";

export const OBJETOS = ["solicitud", "operadora", "tarjeta", "grupo"] as const;
export type Objeto = (typeof OBJETOS)[number];

export function esObjeto(x: unknown): x is Objeto {
  return typeof x === "string" && (OBJETOS as readonly string[]).includes(x);
}

/** Qué facultad hace falta para tener cada cosa, y de qué lado es. */
export const OBJETO: Record<Objeto, { facultad: Facultad; de: "numan" | "operadora"; uno: string; varios: string }> = {
  solicitud: { facultad: "onboarding", de: "numan", uno: "solicitud", varios: "solicitudes" },
  operadora: { facultad: "onboarding", de: "numan", uno: "operadora", varios: "operadoras" },
  tarjeta: { facultad: "clientes", de: "operadora", uno: "tarjeta", varios: "tarjetas" },
  grupo: { facultad: "clientes", de: "operadora", uno: "grupo", varios: "grupos" },
};

export type Persona = {
  id: string;
  activo: boolean;
  numan: boolean;
  facultades: readonly string[];
  operadoras: { id: string }[];
};

/**
 * ¿Esta persona puede TENER este objeto? Activa, con la facultad, y del lado
 * correcto: lo de numan exige `numan`; lo de una operadora exige trabajar para
 * ESA operadora (`operatorId` del objeto). Es la misma regla para tomar, para
 * que se lo asignen y para recibirlo en una transferencia — una sola puerta.
 */
export function puedeTener(p: Persona | null | undefined, objeto: Objeto, operatorId: string | null): boolean {
  if (!p || !p.activo) return false;
  const r = OBJETO[objeto];
  if (!p.facultades.includes(r.facultad)) return false;
  if (r.de === "numan") return p.numan;
  return !!operatorId && p.operadoras.some((o) => o.id === operatorId);
}

export type FilaLibro = {
  id: string;
  staff_id: string;
  objeto: Objeto;
  objeto_id: string;
  desde: string;
  hasta: string | null;
  cierre: string | null;
};

/** La cartera de una persona: sus filas abiertas, por objeto. */
export function carteraDe(libro: FilaLibro[], staffId: string): Record<Objeto, string[]> {
  const out: Record<Objeto, string[]> = { solicitud: [], operadora: [], tarjeta: [], grupo: [] };
  for (const f of libro) if (f.staff_id === staffId && f.hasta === null) out[f.objeto].push(f.objeto_id);
  return out;
}

/** Quién tenía el objeto en ese instante (null si nadie). */
export function titularEn(libro: FilaLibro[], objeto: Objeto, objetoId: string, cuando: string): string | null {
  const t = new Date(cuando).getTime();
  const f = libro.find(
    (x) =>
      x.objeto === objeto &&
      x.objeto_id === objetoId &&
      new Date(x.desde).getTime() <= t &&
      (x.hasta === null || new Date(x.hasta).getTime() > t),
  );
  return f ? f.staff_id : null;
}

/**
 * A quién pasó la cartera de alguien que se fue: las filas que se cerraron por
 * `baja` y la fila que se abrió en su lugar. Se DERIVA del libro, no se guarda
 * aparte: si mañana se transfiere de nuevo, el libro lo dice y esto lo sigue.
 * Devuelve los staff_id receptores, sin repetir (puede ser más de uno si la
 * cartera se repartió).
 */
export function aQuienPaso(libro: FilaLibro[], staffId: string): string[] {
  const vistos = new Set<string>();
  for (const f of libro) {
    if (f.staff_id !== staffId || f.cierre !== "baja" || !f.hasta) continue;
    const sig = libro.find(
      (x) => x.objeto === f.objeto && x.objeto_id === f.objeto_id && x.staff_id !== staffId && x.desde >= f.hasta!,
    );
    if (sig) vistos.add(sig.staff_id);
  }
  return [...vistos];
}

/** «2 operadoras en su cartera · 1 tarjeta abierta», o lo que no hay todavía. */
export function lineaDeHoy(c: Record<Objeto, string[]>, lados: { numan: boolean; operadora: boolean }): string {
  const pl = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
  const n = c.operadora.length + c.solicitud.length;
  const o = c.tarjeta.length + c.grupo.length;
  const numan = n
    ? pl(c.operadora.length, "operadora en su cartera", "operadoras en su cartera") +
      (c.solicitud.length ? ` · ${pl(c.solicitud.length, "solicitud en curso", "solicitudes en curso")}` : "")
    : "Todavía sin operadoras en su cartera";
  const op = o
    ? pl(c.tarjeta.length, "tarjeta abierta", "tarjetas abiertas") +
      (c.grupo.length ? ` · ${pl(c.grupo.length, "grupo", "grupos")}` : "")
    : "Todavía sin tarjetas";
  if (lados.numan && lados.operadora) return `${numan} · ${op}`;
  if (lados.numan) return numan;
  return op;
}
