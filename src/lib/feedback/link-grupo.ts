"use server";

// El link de la encuesta de UNA salida, para mandarlo por WhatsApp.
//
// Se genera bajo demanda porque las salidas viejas nacieron sin token: sin esto
// el panel decía «nadie respondió» y no ofrecía con qué arreglarlo. Es
// idempotente — si ya existe, devuelve el mismo y no rota el link que alguien ya
// pudo haber compartido.

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { alcanceActual, alcanzaSlot } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function generarLinkDeGrupo(
  slotId: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  if (!(await alcanzaSlot(await alcanceActual(), slotId))) {
    return { ok: false, error: "Esa salida no es tuya." };
  }

  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("feedback_token")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) return { ok: false, error: "No se encontró la salida." };

  const ya = (slot as { feedback_token: string | null }).feedback_token;
  if (ya) return { ok: true, token: ya };

  const token = randomUUID();
  const { error } = await sb
    .from("experience_slots")
    .update({ feedback_token: token })
    .eq("id", slotId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/caminante/admin/salidas");
  return { ok: true, token };
}
