"use server";

// Reenvío de correos desde el panel de admin. Cada action re-verifica admin.
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resendSurveyEmail } from "@/lib/feedback/send";

// Reenvía la encuesta de UNA persona pendiente (por feedback id).
export async function reenviarEncuesta(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const id = String(formData.get("feedbackId") ?? "").trim();
  if (id) await resendSurveyEmail(id);
  revalidatePath("/caminante/admin/encuesta");
}

// Reenvía la encuesta a TODOS los pendientes de una experiencia.
export async function reenviarEncuestaPendientes(formData: FormData): Promise<void> {
  if (!(await isCurrentUserAdmin())) return;
  const experienceId = String(formData.get("experienceId") ?? "").trim();
  if (experienceId) {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("experience_feedback")
      .select("id")
      .eq("experience_id", experienceId)
      .neq("status", "submitted");
    for (const r of (data ?? []) as { id: string }[]) {
      await resendSurveyEmail(r.id);
    }
  }
  revalidatePath("/caminante/admin/encuesta");
}
