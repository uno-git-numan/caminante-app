"use server";

// LA CLÁUSULA DE CUPO MÍNIMO EN EL PANEL (D26 de legal): capturar el mínimo y
// la fecha de confirmación de una salida, y confirmar que sale.
//
// Las puede tocar quien puede editar la salida: la casa o su operadora. Cada
// acción re-verifica: el candado de la pantalla no cubre una acción llamada
// directo.

import { revalidatePath } from "next/cache";
import { puedeEditarSlot } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cambioQuePerjudica, clausulaDeSalida, type EstadoDeClausula } from "@/lib/cancelacion/cupo-minimo";
import { ymdCdmx } from "@/lib/cancelacion/politica";
import { COLS_CLAUSULA, confirmarSalida, copiasDeClausula, paraClausula, type FilaDeSalida } from "@/lib/cancelacion/cupo-servidor";

/**
 * Guarda el mínimo y la fecha de confirmación de una salida. Vacíos = sin
 * cláusula. Devuelve si la cláusula quedó activa y, si no, por qué: una fecha
 * fuera del piso se guarda, pero la cláusula no se muestra y cancelar por
 * falta de grupo sigue generando la bonificación.
 */
export async function guardarClausulaDeSalida(
  slotId: string,
  minimo: string,
  limite: string,
): Promise<{ ok: true; estado: EstadoDeClausula } | { ok: false; error: string }> {
  if (!(await puedeEditarSlot(slotId))) return { ok: false, error: "Sin permiso." };
  const min = minimo.trim() === "" ? null : Number(minimo);
  if (min != null && (!Number.isInteger(min) || min < 1)) return { ok: false, error: "El mínimo es un número entero de personas." };
  const fecha = limite.trim() || null;
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "La fecha de confirmación no se entiende." };

  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("experience_slots").select(`${COLS_CLAUSULA}, capacity_total`).eq("id", slotId).maybeSingle();
  const slot = data as (FilaDeSalida & { capacity_total: number | null }) | null;
  if (!slot) return { ok: false, error: "Esa salida no existe." };
  if (slot.status === "cancelled") return { ok: false, error: "Esa salida está cancelada." };
  if (fecha && slot.starts_at && fecha > ymdCdmx(slot.starts_at)) return { ok: false, error: "La fecha de confirmación no puede ser después de la salida." };
  if (min != null && slot.capacity_total != null && min > slot.capacity_total) {
    return { ok: false, error: `El mínimo no puede pasar del cupo (${slot.capacity_total}).` };
  }

  // §7.4: no se empeora lo que ya aceptó alguien que pagó.
  const porque = cambioQuePerjudica({ minimo: min, confirmacionLimite: fecha }, await copiasDeClausula(sb, slotId));
  if (porque) return { ok: false, error: porque };

  const { error } = await sb.from("experience_slots").update({ minimo: min, confirmacion_limite: fecha }).eq("id", slotId);
  // El mismo candado vive en la base (trigger 0093): si alguien pagó entre la
  // lectura y la escritura, el mensaje llega de ahí.
  if (error) return { ok: false, error: error.message };

  revalidatePath("/caminante/admin/salidas");
  return { ok: true, estado: clausulaDeSalida(paraClausula({ ...slot, minimo: min, confirmacion_limite: fecha })) };
}

/** Confirma que la salida sale y avisa al grupo. Una salida confirmada ya no se cancela por cupo. */
export async function confirmarSalidaAction(slotId: string): Promise<{ ok: true; mensaje: string } | { ok: false; error: string }> {
  if (!(await puedeEditarSlot(slotId))) return { ok: false, error: "Sin permiso." };
  const supabase = await createSupabaseServerClient();
  const { data: u } = await supabase.auth.getUser();
  const r = await confirmarSalida(createSupabaseAdminClient(), slotId, u.user?.id ?? null);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/caminante/admin/salidas");
  return {
    ok: true,
    mensaje: r.ya
      ? "La salida ya estaba confirmada."
      : `Salida confirmada. Se le avisó a ${r.avisados} ${r.avisados === 1 ? "persona" : "personas"} del grupo.`,
  };
}
