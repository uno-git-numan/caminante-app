"use server";

// LA ATRIBUCIÓN DESDE EL PANEL (0071) — tomar, asignar, transferir, soltar.
//
// Quién puede qué:
//   · TOMAR (yo mismo): cualquiera del equipo con la facultad del objeto y de
//     su lado (numan para solicitudes y operadoras; su operadora para tarjetas
//     y grupos). Sólo si nadie la tiene: las solicitudes son libres, no se
//     arrebatan.
//   · ASIGNAR / SOLTAR: la casa, y una operadora sobre lo suyo.
//   · TRANSFERIR: la casa, la operadora sobre lo suyo, o quien la tiene.
//     Quien recibe pasa por la misma puerta que para tomar (`puedeTener`).
//
// Lo que NO hace: mover dinero. La comisión se DERIVA del libro y de
// `payments.vendedor_id`; aquí sólo se escribe de quién es cada cosa.

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin, correoEnSesion } from "@/lib/auth/authorization";
import { alcanceActual, equipoDelAlcance, esOperador } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { atribuir, cerrarAtribucion, titularDe, transferirAtribucion } from "@/lib/equipo/atribucion";
import { esObjeto, OBJETO, puedeTener, type Objeto, type Persona } from "@/lib/equipo/atribucion-reglas";

export type ResAtrib = { ok: true } | { ok: false; error: string };

const RUTAS = ["/caminante/admin/plataforma/equipo", "/caminante/admin/plataforma/comunidad", "/caminante/admin/comunidad", "/caminante/admin/mi-alta/equipo"];
const listo = (): ResAtrib => {
  for (const r of RUTAS) revalidatePath(r);
  return { ok: true };
};

/** La persona del equipo como la ven las reglas, o null si no está/inactiva. */
async function personaDe(staffId: string): Promise<Persona | null> {
  const sb = createSupabaseAdminClient();
  const [{ data: s }, { data: ops }] = await Promise.all([
    sb.from("staff").select("id, activo, numan, facultades").eq("id", staffId).maybeSingle(),
    sb.from("staff_operadoras").select("operator_id").eq("staff_id", staffId),
  ]);
  if (!s) return null;
  const f = s as { id: string; activo: boolean; numan: boolean; facultades: unknown };
  return {
    id: f.id,
    activo: f.activo === true,
    numan: f.numan === true,
    facultades: Array.isArray(f.facultades) ? (f.facultades as string[]) : [],
    operadoras: ((ops ?? []) as { operator_id: string }[]).map((o) => ({ id: o.operator_id })),
  };
}

/** De qué operadora es el objeto (null para lo de numan o si no se encuentra). */
async function operadoraDelObjeto(objeto: Objeto, objetoId: string): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  if (objeto === "tarjeta") {
    const { data } = await sb.from("crm_cards").select("operator_id").eq("id", objetoId).maybeSingle();
    return (data as { operator_id: string | null } | null)?.operator_id ?? null;
  }
  if (objeto === "grupo") {
    const { data } = await sb.from("experience_slots").select("experiences(operator_id)").eq("id", objetoId).maybeSingle();
    return (data as unknown as { experiences: { operator_id: string | null } | null } | null)?.experiences?.operator_id ?? null;
  }
  return null;
}

/** Quién pide: la casa, una operadora (sobre lo suyo), o alguien del equipo. */
async function quienPide(): Promise<
  { casa: true; staffId: null; operatorId: null } | { casa: false; staffId: string | null; operatorId: string | null } | null
> {
  if (await isCurrentUserAdmin()) return { casa: true, staffId: null, operatorId: null };
  const a = await alcanceActual();
  if (!a) return null;
  const eq = equipoDelAlcance(a);
  const operatorId = esOperador(a) && !a.equipo ? a.operatorId : null;
  if (!eq && !operatorId) return null;
  return { casa: false, staffId: eq?.staffId ?? null, operatorId };
}

function objetoValido(objeto: string, objetoId: string): { objeto: Objeto; objetoId: string } | null {
  const id = (objetoId ?? "").trim();
  return esObjeto(objeto) && id ? { objeto, objetoId: id } : null;
}

/** Yo tomo esto. Sólo si nadie lo tiene. */
export async function tomar(objetoRaw: string, objetoIdRaw: string): Promise<ResAtrib> {
  const o = objetoValido(objetoRaw, objetoIdRaw);
  if (!o) return { ok: false, error: "No sé qué tomar." };
  const quien = await quienPide();
  if (!quien || quien.casa || !quien.staffId) return { ok: false, error: "Sólo alguien del equipo toma; la casa asigna." };
  const p = await personaDe(quien.staffId);
  const opId = await operadoraDelObjeto(o.objeto, o.objetoId);
  if (!puedeTener(p, o.objeto, opId)) return { ok: false, error: `No tienes la facultad para llevar ${OBJETO[o.objeto].varios}.` };
  const r = await atribuir({ staffId: quien.staffId, ...o, como: "tomada", por: await correoEnSesion() });
  if (!r.ok) return { ok: false, error: r.error };
  return listo();
}

/** La casa (o la operadora, sobre lo suyo) se lo da a alguien. Pisa a quien lo tenga: es una decisión, no una carrera. */
export async function asignar(objetoRaw: string, objetoIdRaw: string, aStaffId: string): Promise<ResAtrib> {
  const o = objetoValido(objetoRaw, objetoIdRaw);
  if (!o) return { ok: false, error: "No sé qué asignar." };
  const quien = await quienPide();
  const opId = await operadoraDelObjeto(o.objeto, o.objetoId);
  if (!quien || (!quien.casa && !(quien.operatorId && opId === quien.operatorId))) return { ok: false, error: "No autorizado." };
  const p = await personaDe((aStaffId ?? "").trim());
  if (!puedeTener(p, o.objeto, opId)) return { ok: false, error: "Esa persona no puede llevar esto: revisa sus facultades y para quién trabaja." };
  const por = await correoEnSesion();
  const t = await titularDe(o.objeto, o.objetoId);
  const r = t
    ? await transferirAtribucion(o.objeto, o.objetoId, p!.id, "transferencia", por)
    : await atribuir({ staffId: p!.id, ...o, como: "asignada", por });
  if (!r.ok) return { ok: false, error: r.error };
  return listo();
}

/**
 * Transferir varias cosas de una persona a otra. Lo devengado hasta hoy sigue
 * siendo de quien las tenía; desde ahora, lo nuevo es de quien las recibe.
 */
export async function transferir(
  items: { objeto: string; objetoId: string }[],
  aStaffId: string,
): Promise<ResAtrib & { hechas?: number }> {
  const quien = await quienPide();
  if (!quien) return { ok: false, error: "No autorizado." };
  const destino = await personaDe((aStaffId ?? "").trim());
  if (!destino) return { ok: false, error: "No encuentro a quien recibe." };
  const por = await correoEnSesion();
  let hechas = 0;
  for (const it of items ?? []) {
    const o = objetoValido(it.objeto, it.objetoId);
    if (!o) continue;
    const t = await titularDe(o.objeto, o.objetoId);
    if (!t) continue;
    const opId = await operadoraDelObjeto(o.objeto, o.objetoId);
    const puede =
      quien.casa || (quien.operatorId && opId === quien.operatorId) || (quien.staffId && t.staffId === quien.staffId);
    if (!puede) return { ok: false, error: `No puedes transferir esa ${OBJETO[o.objeto].uno}.` };
    if (!puedeTener(destino, o.objeto, opId)) {
      return { ok: false, error: `Quien recibe no puede llevar ${OBJETO[o.objeto].varios}: revisa sus facultades y para quién trabaja.` };
    }
    const r = await transferirAtribucion(o.objeto, o.objetoId, destino.id, "transferencia", por);
    if (!r.ok) return { ok: false, error: r.error };
    hechas++;
  }
  for (const r of RUTAS) revalidatePath(r);
  return { ok: true, hechas };
}

/** La casa se lo quita a alguien sin dárselo a nadie. */
export async function soltar(objetoRaw: string, objetoIdRaw: string): Promise<ResAtrib> {
  const o = objetoValido(objetoRaw, objetoIdRaw);
  if (!o) return { ok: false, error: "No sé qué soltar." };
  const quien = await quienPide();
  const opId = await operadoraDelObjeto(o.objeto, o.objetoId);
  if (!quien || (!quien.casa && !(quien.operatorId && opId === quien.operatorId))) return { ok: false, error: "No autorizado." };
  const c = await cerrarAtribucion(o.objeto, o.objetoId, "soltada");
  if (!c.ok) return { ok: false, error: "No se pudo soltar." };
  return listo();
}
