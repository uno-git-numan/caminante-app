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

export async function setTestimonioAction(fd: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) volver({ error: "Solo el admin puede hacer esto." });

  const id = typeof fd.get("id") === "string" ? (fd.get("id") as string).trim() : "";
  const decision = fd.get("decision"); // approved | rejected
  if (!id || !["approved", "rejected"].includes(String(decision))) {
    volver({ error: "Decisión inválida." });
  }

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experience_feedback")
    .select("id, testimonial_consent")
    .eq("id", id)
    .maybeSingle();
  if (!row) volver({ error: "Ese testimonio no existe." });
  if (decision === "approved" && !row.testimonial_consent) {
    volver({ error: "No hay consentimiento para publicar este testimonio." });
  }

  const { error } = await sb
    .from("experience_feedback")
    .update({ publish_status: decision })
    .eq("id", id);
  if (error) volver({ error: error.message });

  volver({ ok: decision === "approved" ? "Testimonio aprobado." : "Testimonio rechazado." });
}
