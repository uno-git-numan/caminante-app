import "server-only";

// QUIÉN LO LLEVA — la lectura del libro para las pantallas de Comunidad.
//
// Tres cosas que una tarjeta necesita para dibujar la línea «Lo lleva» y su
// control (lámina «Quién lo lleva», 27 sep 2026): la titularidad de cada
// objeto, la gente del equipo que podría llevarlo, y quién soy yo. Todo en
// tres consultas por página, no una por tarjeta.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { alcanceActual, equipoDelAlcance } from "@/lib/auth/alcance";
import { claveTit, type Objeto, type PersonaParaAsignar, type Titularidad, type Yo } from "@/lib/equipo/atribucion-reglas";

export { claveTit };
export type { PersonaParaAsignar, Titularidad, Yo };

export async function fetchTitularidades(items: { objeto: Objeto; id: string }[]): Promise<Record<string, Titularidad>> {
  const out: Record<string, Titularidad> = {};
  if (!items.length) return out;
  const sb = createSupabaseAdminClient();
  const ids = [...new Set(items.map((i) => i.id))];
  const { data, error } = await sb
    .from("staff_atribuciones")
    .select("staff_id, objeto, objeto_id, desde, hasta, cierre, staff(nombre)")
    .in("objeto_id", ids)
    .order("desde", { ascending: false });
  if (error) return out;
  type Fila = { staff_id: string; objeto: Objeto; objeto_id: string; desde: string; hasta: string | null; cierre: string | null; staff: { nombre: string } | null };
  const filas = (data ?? []) as unknown as Fila[];
  for (const it of items) {
    const k = claveTit(it.objeto, it.id);
    const mias = filas.filter((f) => f.objeto === it.objeto && f.objeto_id === it.id);
    const abierta = mias.find((f) => f.hasta === null);
    if (abierta) {
      out[k] = { staffId: abierta.staff_id, nombre: abierta.staff?.nombre ?? "alguien del equipo", desde: abierta.desde };
      continue;
    }
    // Suelta porque alguien se fue: se dice desde cuándo y quién la llevaba.
    const baja = mias.find((f) => f.cierre === "baja");
    out[k] = baja ? { ex: baja.staff?.nombre ?? "alguien del equipo", desde: baja.hasta! } : null;
  }
  return out;
}

/** El equipo activo, con lo que `puedeTener` necesita para decidir quién entra en la lista. */
export async function fetchEquipoParaAsignar(): Promise<PersonaParaAsignar[]> {
  const sb = createSupabaseAdminClient();
  const [{ data: staff }, { data: rel }] = await Promise.all([
    sb.from("staff").select("id, nombre, numan, facultades").eq("activo", true).order("nombre"),
    sb.from("staff_operadoras").select("staff_id, operator_id"),
  ]);
  const ops = new Map<string, { id: string }[]>();
  for (const r of (rel ?? []) as { staff_id: string; operator_id: string }[]) {
    if (!ops.has(r.staff_id)) ops.set(r.staff_id, []);
    ops.get(r.staff_id)!.push({ id: r.operator_id });
  }
  return ((staff ?? []) as { id: string; nombre: string; numan: boolean; facultades: unknown }[]).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    activo: true,
    numan: s.numan === true,
    facultades: Array.isArray(s.facultades) ? (s.facultades as string[]) : [],
    operadoras: ops.get(s.id) ?? [],
  }));
}

/** Quién mira: la casa (asigna), alguien del equipo (toma o pasa lo suyo), o nadie de eso. */
export async function quienSoyParaAsignar(): Promise<Yo> {
  if (await isCurrentUserAdmin()) return { casa: true, staffId: null };
  const eq = equipoDelAlcance(await alcanceActual());
  return { casa: false, staffId: eq?.staffId ?? null };
}
