import "server-only";

// LO QUE EL TABLERO HACE SOLO — las etapas que nadie arrastra.
//
// Pagado cae con el pago, Preparando cuando la salida está a dos semanas y
// Viajó cuando la fecha pasó. Hasta el 21 oct 2026 nada de esto existía: las
// columnas decían «cae solo» y ninguna tarjeta había caído jamás. Un tablero
// que promete automático y no lo cumple enseña a no mirarlo.
//
// Todo es best-effort y nunca tumba lo que lo llama: perder un movimiento de
// tarjeta es recuperable (se arrastra, se reintenta mañana); perder un pago o
// cerrar una salida, no.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cdmxDay } from "@/lib/admin/formato";

type Sb = ReturnType<typeof createSupabaseAdminClient>;

/** A cuántos días de la salida arranca la preparación (el primer mensaje de la casa). */
export const DIAS_PREPARANDO = 14;

const ahora = () => new Date().toISOString();

/**
 * Un pago confirmado mueve a «Pagado» la tarjeta viva de esa persona en esa
 * experiencia, y la amarra a su reserva y su salida. Sólo avanza: una tarjeta
 * que ya iba más adelante no se regresa.
 */
export async function tarjetaPagada(
  sb: Sb,
  i: { contactId: string; experienceId: string; reservationId: string; slotId: string | null },
): Promise<void> {
  try {
    const { data: cards } = await sb
      .from("crm_cards")
      .select("id, stage, slot_id")
      .eq("contact_id", i.contactId)
      .eq("experience_id", i.experienceId)
      .in("stage", ["llego", "conversacion", "interesado"]);
    for (const c of (cards ?? []) as { id: string; stage: string; slot_id: string | null }[]) {
      // Si la tarjeta ya habla de OTRA salida, no es ésta la que pagó.
      if (c.slot_id && i.slotId && c.slot_id !== i.slotId) continue;
      await sb
        .from("crm_cards")
        .update({
          stage: "pagado",
          reservation_id: i.reservationId,
          slot_id: c.slot_id ?? i.slotId,
          stage_changed_at: ahora(),
          updated_at: ahora(),
        })
        .eq("id", c.id);
    }
  } catch (e) {
    console.error("tarjetaPagada:", e);
  }
}

/**
 * El reloj: Pagado → Preparando a DIAS_PREPARANDO de la salida; Pagado o
 * Preparando → Viajó cuando la fecha ya pasó. Corre una vez al día.
 */
export async function avanzarTarjetasPorFecha(now = new Date()): Promise<{ preparando: number; viajo: number }> {
  const sb = createSupabaseAdminClient();
  const res = { preparando: 0, viajo: 0 };
  const { data: cards } = await sb
    .from("crm_cards")
    .select("id, stage, slot_id")
    .in("stage", ["pagado", "preparando"])
    .not("slot_id", "is", null);
  const filas = (cards ?? []) as { id: string; stage: string; slot_id: string }[];
  if (!filas.length) return res;
  const { data: slots } = await sb
    .from("experience_slots")
    .select("id, starts_at, ends_at")
    .in("id", [...new Set(filas.map((c) => c.slot_id))]);
  const slot = new Map(((slots ?? []) as { id: string; starts_at: string | null; ends_at: string | null }[]).map((s) => [s.id, s]));
  const hoy = cdmxDay(now);
  for (const c of filas) {
    const s = slot.get(c.slot_id);
    if (!s?.starts_at) continue;
    const fin = s.ends_at ?? s.starts_at;
    const diasParaSalir = Math.round((new Date(`${cdmxDay(s.starts_at)}T00:00:00`).getTime() - new Date(`${hoy}T00:00:00`).getTime()) / 86400000);
    let destino: string | null = null;
    if (cdmxDay(fin) < hoy) destino = "viajo";
    else if (c.stage === "pagado" && diasParaSalir <= DIAS_PREPARANDO) destino = "preparando";
    if (!destino || destino === c.stage) continue;
    const { error } = await sb
      .from("crm_cards")
      .update({ stage: destino, stage_changed_at: ahora(), updated_at: ahora() })
      .eq("id", c.id);
    if (!error) res[destino as "preparando" | "viajo"]++;
  }
  return res;
}
