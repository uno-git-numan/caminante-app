"use server";

// Moderación de testimonios de la encuesta. Aprobar exige el consentimiento
// explícito del viajero (testimonial_consent) — sin consentimiento no se
// publica, punto (LFPDPPP). Re-verifica admin en cada acción.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

function volver(msg: { ok?: string; error?: string }): never {
  const q = msg.ok
    ? `ok=${encodeURIComponent(msg.ok)}`
    : `error=${encodeURIComponent(msg.error || "Algo falló.")}`;
  revalidatePath("/caminante/admin/encuesta");
  redirect(`/caminante/admin/encuesta?${q}`);
}

// El núcleo devuelve `{ok, error}` y la acción de formulario lo envuelve con el
// redirect del panel. La app del teléfono llama el núcleo desde JS: un redirect
// la sacaría del panel móvil hacia la vista de computadora. La regla que importa
// —sin consentimiento no se publica— vive una sola vez, aquí.
export async function setTestimonio(
  id: string,
  decision: "approved" | "rejected",
): Promise<{ ok: boolean; error?: string; mensaje?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "Solo el admin puede hacer esto." };

  const rowId = (id || "").trim();
  if (!rowId || !["approved", "rejected"].includes(decision)) {
    return { ok: false, error: "Decisión inválida." };
  }

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experience_feedback")
    .select("id, testimonial_consent")
    .eq("id", rowId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Ese testimonio no existe." };
  if (decision === "approved" && !row.testimonial_consent) {
    return { ok: false, error: "No hay consentimiento para publicar este testimonio." };
  }

  const { error } = await sb
    .from("experience_feedback")
    .update({ publish_status: decision })
    .eq("id", rowId);
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    mensaje: decision === "approved" ? "Testimonio aprobado." : "Testimonio rechazado.",
  };
}

export async function setTestimonioAction(fd: FormData): Promise<void> {
  const id = typeof fd.get("id") === "string" ? (fd.get("id") as string).trim() : "";
  const decision = String(fd.get("decision")); // approved | rejected
  const res = await setTestimonio(id, decision as "approved" | "rejected");
  volver(res.ok ? { ok: res.mensaje } : { error: res.error });
}
