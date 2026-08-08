"use server";

// Genera (o recupera) el LINK ABIERTO de encuesta de una salida — el que Luis
// manda al grupo de WhatsApp para los acompañantes y para quien no vio el correo.
// Ver el porqué en `src/lib/feedback/abierta.ts` y la migración 0031.
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SITE = "https://caminante.numanhub.com";
const PANEL = "/caminante/admin/encuesta";

export const linkAbierto = async (token: string): Promise<string> =>
  `${SITE}/caminante/feedback/salida/${token}`;

// Idempotente: si la salida ya tiene token, devuelve el mismo link (así el que
// ya se mandó al grupo nunca se invalida por volver a picar el botón).
export async function generarLinkEncuestaSalida(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const slotId = String(formData.get("slotId") ?? "").trim();
  if (!slotId) return;

  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, feedback_token, experiences(data)")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) {
    redirect(`${PANEL}?error=${encodeURIComponent("Esa salida no existe.")}`);
  }

  // Mismo criterio que el cron: sin encuesta activa el link no serviría de nada.
  const activa = ((slot.experiences as { data?: { feedback?: { active?: boolean } } } | null)?.data
    ?.feedback?.active) === true;
  if (!activa) {
    redirect(
      `${PANEL}?error=${encodeURIComponent(
        "La encuesta de esa experiencia está apagada: enciéndela en el formulario antes de generar el link.",
      )}`,
    );
  }

  let token = (slot.feedback_token as string | null) ?? null;
  if (!token) {
    token = randomBytes(16).toString("base64url");
    const { error } = await sb
      .from("experience_slots")
      .update({ feedback_token: token })
      .eq("id", slotId);
    if (error) {
      console.error("generarLinkEncuestaSalida:", error);
      redirect(`${PANEL}?error=${encodeURIComponent("No se pudo generar el link.")}`);
    }
  }

  revalidatePath(PANEL);
  redirect(`${PANEL}?link=${encodeURIComponent(await linkAbierto(token))}`);
}
