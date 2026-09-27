// LAS REGLAS DE LA ATRIBUCIÓN (0071) — puro, sin servidor, para pantallas y pruebas.
//
// Qué se atribuye, quién puede tenerlo, y cómo se lee el libro. Lo que toca
// la base vive en `atribucion.ts`; aquí sólo hay decisiones.

import type { Facultad } from "@/lib/equipo/facultades";

export const OBJETOS = ["solicitud", "operadora", "tarjeta", "grupo", "embajador"] as const;
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
  // 0072: el que aplicó a embajador; de la operadora que lo contesta.
  embajador: { facultad: "clientes", de: "operadora", uno: "embajador", varios: "embajadores" },
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
  const out: Record<Objeto, string[]> = { solicitud: [], operadora: [], tarjeta: [], grupo: [], embajador: [] };
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
  const o = c.tarjeta.length + c.grupo.length + c.embajador.length;
  const numan = n
    ? pl(c.operadora.length, "operadora en su cartera", "operadoras en su cartera") +
      (c.solicitud.length ? ` · ${pl(c.solicitud.length, "solicitud en curso", "solicitudes en curso")}` : "")
    : "Todavía sin operadoras en su cartera";
  const op = o
    ? pl(c.tarjeta.length, "tarjeta abierta", "tarjetas abiertas") +
      (c.grupo.length ? ` · ${pl(c.grupo.length, "grupo", "grupos")}` : "") +
      (c.embajador.length ? ` · ${pl(c.embajador.length, "embajador", "embajadores")}` : "")
    : "Todavía sin tarjetas";
  if (lados.numan && lados.operadora) return `${numan} · ${o ? op : "todavía sin tarjetas"}`;
  if (lados.numan) return numan;
  return op;
}

/**
 * QUÉ BOTÓN VE CADA QUIEN (lámina «Quién lo lleva»). La casa asigna, no toma:
 * «asignar» si nadie la lleva, «pasar» si alguien la lleva. Alguien del
 * equipo con la puerta abierta (`door` = `puedeTener`): «tomar» si nadie la
 * lleva, «pasar» si la lleva él; si la lleva otro, sólo la ve. Sin puerta,
 * nada — ni deshabilitado: no está.
 */
export function verboDeAsignacion(
  tit: { staffId: string } | { ex: string } | null,
  yo: { casa: boolean; staffId: string | null },
  door: boolean,
): "asignar" | "pasar" | "tomar" | null {
  const who = tit && "staffId" in tit ? tit.staffId : null;
  if (yo.casa) return who ? "pasar" : "asignar";
  if (!door || !yo.staffId) return null;
  if (!who) return "tomar";
  return who === yo.staffId ? "pasar" : null;
}

// ── Lo que las pantallas de «Quién lo lleva» necesitan sin tocar el servidor ──

/** Con titular; o suelta desde que alguien se fue (se ve de dónde viene); o nadie. */
export type Titularidad =
  | { staffId: string; nombre: string; desde: string }
  | { ex: string; desde: string }
  | null;

export type PersonaParaAsignar = Persona & { nombre: string };

/** Quién mira: la casa (asigna), alguien del equipo (toma o pasa lo suyo), o nadie de eso. */
export type Yo = { casa: boolean; staffId: string | null };

export const claveTit = (objeto: Objeto, id: string) => `${objeto}:${id}`;

/**
 * Qué se atribuye de una operadora del pipeline: su solicitud mientras está
 * en el embudo (Llegó / En llamada), su fila después.
 *
 * ⚠️ Vive aquí y no en Pipeline.tsx a propósito: ese archivo es "use client",
 * y una función exportada desde un módulo cliente e importada por una página
 * de servidor NO es la función — Next entrega una referencia de cliente, y
 * llamarla tira la página entera con «Application error». Pasó en producción
 * el 27 sep 2026 con /plataforma/comunidad.
 */
export const objetoDeOperadora = (o: { etapa: string; solicitudId: string | null }): { objeto: Objeto; id: string | null } =>
  (o.etapa === "llego" || o.etapa === "en_llamada") && o.solicitudId ? { objeto: "solicitud", id: o.solicitudId } : { objeto: "operadora", id: null };
