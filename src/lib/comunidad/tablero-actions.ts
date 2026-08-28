"use server";

// Mover una tarjeta del tablero. La ÚNICA escritura del CRM por ahora.

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { A_MANO } from "@/lib/comunidad/etapas";

// ⚠️ Sólo estas tres se mueven a mano. Pagado, Preparando y Viajó SÓLO reciben
// automático: la primera con el webhook de Stripe, la segunda con el pago
// confirmado, la tercera con la fecha. Declarar pagado a quien no pagó
// descuadraría el dinero y el roster, y nadie se enteraría.
// Se lee del módulo puro; «caido» se suma aquí porque dar por perdida una
// tarjeta SÍ es una decisión humana.
const MOVIBLE = new Set([...A_MANO, "caido"]);

export type MoverResult = { ok: true } | { ok: false; error: string };

export async function moverTarjeta(cardId: string, destino: string, motivo?: string): Promise<MoverResult> {
  if (!(await puedeEntrarAlPanel())) return { ok: false, error: "Sin permiso." };
  if (!MOVIBLE.has(destino)) {
    return {
      ok: false,
      error:
        destino === "pagado"
          ? "«Pagado» no se pone a mano: entra cuando Stripe confirma el pago."
          : "Esa columna sólo recibe automático.",
    };
  }
  // Perder es un dato: sin motivo, la caída no enseña nada. La base también lo
  // exige (0045), pero se dice aquí con palabras que se entienden.
  if (destino === "caido" && !(motivo ?? "").trim()) {
    return { ok: false, error: "Una tarjeta caída necesita su motivo: es lo único que enseña algo." };
  }

  const sb = createSupabaseAdminClient();
  const { data: actual } = await sb.from("crm_cards").select("stage").eq("id", cardId).maybeSingle();
  if (!actual) return { ok: false, error: "Esa tarjeta ya no existe." };
  if (!MOVIBLE.has(String(actual.stage))) {
    return { ok: false, error: "Una tarjeta que ya pagó no se regresa a mano." };
  }

  const { error } = await sb
    .from("crm_cards")
    .update({
      stage: destino,
      stage_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(destino === "caido" ? { motivo_caida: (motivo ?? "").trim() } : {}),
    })
    .eq("id", cardId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/caminante/admin/comunidad");
  return { ok: true };
}
