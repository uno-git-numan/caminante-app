import "server-only";

// LO QUE LA FICHA DICE DE CADA FECHA SOBRE EL GRUPO MÍNIMO (D26 de legal, §7.8).
//
// La ficha es la oferta, y la oferta tiene que decir el mínimo de personas
// (NOM-010-TUR-2001, 6.2.5). Junto a cada fecha con la cláusula activa va
// «Mínimo N personas · se confirma a más tardar el [día] de [mes]», y cuando la
// salida ya se confirmó, «Salida confirmada». Es informativo: la aceptación y
// la prueba siguen en reservar y en la página de pago.
//
// Vive aparte de cupo-servidor.ts a propósito: lo llama la disponibilidad
// pública, que no debe arrastrar correos ni el panel. Y es tolerante: si las
// columnas no existen todavía (antes de la 0093), ninguna fecha dice nada.

import type { SupabaseClient } from "@supabase/supabase-js";
import { clausulaDeSalida } from "@/lib/cancelacion/cupo-minimo";
import type { ClausulaMinimo } from "@/lib/cancelacion/politica";

export type GrupoMinimoPublico = { clausula: ClausulaMinimo | null; confirmada: boolean };

export async function grupoMinimoPublico(sb: SupabaseClient, slotIds: string[], ahora: Date = new Date()): Promise<Map<string, GrupoMinimoPublico>> {
  const out = new Map<string, GrupoMinimoPublico>();
  if (!slotIds.length) return out;
  const { data, error } = await sb
    .from("experience_slots")
    .select("id, starts_at, ends_at, status, minimo, confirmacion_limite, confirmada_at")
    .in("id", slotIds);
  if (error) return out;
  type Fila = { id: string; starts_at: string | null; ends_at: string | null; status: string; minimo: number | null; confirmacion_limite: string | null; confirmada_at: string | null };
  for (const s of (data ?? []) as Fila[]) {
    const e = clausulaDeSalida(
      { minimo: s.minimo, confirmacionLimite: s.confirmacion_limite, startsAt: s.starts_at, endsAt: s.ends_at, confirmadaAt: s.confirmada_at, status: s.status },
      ahora,
    );
    const confirmada = !!s.confirmada_at && s.status !== "cancelled";
    if (e.activa || confirmada) out.set(s.id, { clausula: e.activa ? e.clausula : null, confirmada });
  }
  return out;
}
