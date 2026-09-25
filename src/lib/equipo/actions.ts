"use server";

// EL EQUIPO — dar de alta, cambiar facultades, dar de baja (0070).
//
// Dos puertas y una sola regla en cada acción:
//   · LA CASA (admin) hace todo: numan, cualquier operadora, cualquier facultad.
//   · UNA OPERADORA (rol operador, sobre sí misma) da de alta a SU gente, sólo
//     para su operadora y sólo con facultades de operadora (nunca `onboarding`,
//     nunca `numan`). «Como una agencia de viajes» (Luis, 25 sep 2026).
//   · EL EQUIPO no administra al equipo, ni siquiera el de numan: dar asientos
//     es de la casa y de la dueña.
//
// La identidad es el correo. Dar de alta no manda correo ni crea cuenta: la
// persona entra con el magic link de siempre y `roleForClient` la reconoce.
// Dar de baja apaga `activo` y sella `baja_at`; la fila se queda, porque lo
// que atribuyó y devengó hasta ese día es suyo (0071+).

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin, correoEnSesion } from "@/lib/auth/authorization";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FACULTADES_DE_OPERADORA, facultadesDe, type Facultad } from "@/lib/equipo/facultades";

export type ResEquipo = { ok: true } | { ok: false; error: string };

const RUTAS = ["/caminante/admin/plataforma/equipo", "/caminante/admin/mi-alta/equipo", "/caminante/admin/mi-alta"];

function limpiarCorreo(raw: unknown): string | null {
  const e = String(raw ?? "").trim().toLowerCase();
  return e.includes("@") && e.length <= 254 ? e : null;
}

/**
 * Quién pide y qué puede pedir. La casa: todo. La operadora: su operadora y
 * facultades de operadora. Nadie más.
 */
async function quienPide(): Promise<
  | { casa: true }
  | { casa: false; operatorId: string }
  | null
> {
  if (await isCurrentUserAdmin()) return { casa: true };
  const a = await alcanceActual();
  // Un EMPLEADO de la operadora también resuelve como `operador` (alcance con
  // `equipo`); se excluye a propósito: el equipo no se administra a sí mismo.
  if (esOperador(a) && !a.equipo) return { casa: false, operatorId: a.operatorId };
  return null;
}

function facultadesPermitidas(quien: { casa: boolean }, pedidas: Facultad[]): Facultad[] {
  return quien.casa ? pedidas : pedidas.filter((f) => FACULTADES_DE_OPERADORA.includes(f));
}

export async function agregarAlEquipo(input: {
  email: string;
  nombre: string;
  numan?: boolean;
  operadoras?: string[];
  facultades?: string[];
  nota?: string;
}): Promise<ResEquipo> {
  const quien = await quienPide();
  if (!quien) return { ok: false, error: "No autorizado." };
  const email = limpiarCorreo(input.email);
  if (!email) return { ok: false, error: "Correo inválido." };
  const nombre = String(input.nombre ?? "").trim().slice(0, 120);
  if (!nombre) return { ok: false, error: "Falta el nombre." };

  const numan = quien.casa ? input.numan === true : false;
  const operadoras = quien.casa
    ? [...new Set((input.operadoras ?? []).map((x) => String(x).trim()).filter(Boolean))]
    : [quien.operatorId];
  const facultades = facultadesPermitidas(quien, facultadesDe(input.facultades));
  if (!numan && operadoras.length === 0) {
    return { ok: false, error: "Dime para quién trabaja: numan, una operadora, o las dos." };
  }

  const sb = createSupabaseAdminClient();
  // ⚠️ Un correo que ya es de la casa no se vuelve equipo: sería bajarle las
  // llaves a medias sin que nadie lo decidiera. Se dice.
  const { data: wl } = await sb.from("admin_whitelist").select("email").eq("email", email).eq("is_active", true).maybeSingle();
  if (wl) return { ok: false, error: "Ese correo es de la casa (admin_whitelist). No se mezcla con el equipo." };

  const { data: previa } = await sb.from("staff").select("id, activo").eq("email", email).maybeSingle();
  const fila = previa as { id: string; activo: boolean } | null;
  // Volver a dar de alta a quien se dio de baja REACTIVA su fila (conserva su
  // historial) en vez de crear una segunda.
  let staffId: string;
  if (fila) {
    const { error } = await sb
      .from("staff")
      .update({ nombre, numan, facultades, activo: true, baja_at: null, nota: input.nota?.trim() || null })
      .eq("id", fila.id);
    if (error) return { ok: false, error: error.message };
    staffId = fila.id;
  } else {
    const { data, error } = await sb
      .from("staff")
      .insert({ email, nombre, numan, facultades, alta_por: await correoEnSesion(), nota: input.nota?.trim() || null })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "No se pudo dar de alta." };
    staffId = (data as { id: string }).id;
  }

  // Sus operadoras: la casa pone la lista completa; la operadora se agrega a
  // sí misma sin tocar las demás (si ya trabaja para otra, se conserva).
  if (quien.casa) {
    await sb.from("staff_operadoras").delete().eq("staff_id", staffId);
  }
  if (operadoras.length) {
    const { error } = await sb
      .from("staff_operadoras")
      .upsert(operadoras.map((operator_id) => ({ staff_id: staffId, operator_id })), { onConflict: "staff_id,operator_id" });
    if (error) return { ok: false, error: error.message };
  }

  for (const r of RUTAS) revalidatePath(r);
  return { ok: true };
}

export async function cambiarFacultades(staffId: string, facultades: string[], numan?: boolean): Promise<ResEquipo> {
  const quien = await quienPide();
  if (!quien) return { ok: false, error: "No autorizado." };
  const id = (staffId ?? "").trim();
  if (!id) return { ok: false, error: "Falta la persona." };
  const sb = createSupabaseAdminClient();
  if (!quien.casa && !(await esDeMiOperadora(id, quien.operatorId))) return { ok: false, error: "No es de tu equipo." };
  const patch: Record<string, unknown> = { facultades: facultadesPermitidas(quien, facultadesDe(facultades)) };
  if (quien.casa && typeof numan === "boolean") patch.numan = numan;
  const { error } = await sb.from("staff").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  for (const r of RUTAS) revalidatePath(r);
  return { ok: true };
}

/**
 * Dar de baja. La casa apaga la fila entera; una operadora sólo se quita a la
 * persona de SU operadora — si además trabaja para numan o para otra, sigue
 * activa ahí.
 */
export async function darDeBaja(staffId: string): Promise<ResEquipo> {
  const quien = await quienPide();
  if (!quien) return { ok: false, error: "No autorizado." };
  const id = (staffId ?? "").trim();
  if (!id) return { ok: false, error: "Falta la persona." };
  const sb = createSupabaseAdminClient();
  if (quien.casa) {
    const { error } = await sb.from("staff").update({ activo: false, baja_at: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    if (!(await esDeMiOperadora(id, quien.operatorId))) return { ok: false, error: "No es de tu equipo." };
    const { error } = await sb.from("staff_operadoras").delete().eq("staff_id", id).eq("operator_id", quien.operatorId);
    if (error) return { ok: false, error: error.message };
    // Si ya no trabaja para nadie, la fila se apaga: un asiento sin puerta.
    const { data: resto } = await sb.from("staff_operadoras").select("operator_id").eq("staff_id", id);
    const { data: fila } = await sb.from("staff").select("numan").eq("id", id).maybeSingle();
    if (!(resto ?? []).length && !(fila as { numan?: boolean } | null)?.numan) {
      await sb.from("staff").update({ activo: false, baja_at: new Date().toISOString() }).eq("id", id);
    }
  }
  for (const r of RUTAS) revalidatePath(r);
  return { ok: true };
}

async function esDeMiOperadora(staffId: string, operatorId: string): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("staff_operadoras")
    .select("staff_id")
    .eq("staff_id", staffId)
    .eq("operator_id", operatorId)
    .maybeSingle();
  return !!data;
}
