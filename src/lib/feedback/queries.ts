import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import type { FeedbackContext, FeedbackSection } from "./types";

// Resuelve la encuesta desde el TOKEN del link (sin login). Trae la config de la
// experiencia (sections variables) + el nombre de pila para el saludo.
export async function fetchFeedbackByToken(
  token: string,
): Promise<FeedbackContext | null> {
  const sb = createSupabaseAdminClient();
  const { data: fb } = await sb
    .from("experience_feedback")
    .select(
      "token, status, location_label, feedback_version, contacts(full_name), experiences(data)",
    )
    .eq("token", token)
    .maybeSingle();
  if (!fb) return null;

  const experience = (fb.experiences as { data?: Experience } | null)?.data;
  const cfg = experience?.feedback;
  const fullName = (fb.contacts as { full_name?: string } | null)?.full_name ?? "";
  const sections: FeedbackSection[] = cfg?.sections ?? [];

  return {
    token: fb.token as string,
    status: fb.status as "invited" | "submitted",
    firstName: fullName.split(" ")[0] || "",
    // referencia por LOCACIÓN (no fecha): primero lo congelado en la fila, luego la config
    locationLabel: (fb.location_label as string | null) || cfg?.locationLabel || "",
    experienceTitle: experience
      ? `${experience.title} ${experience.titleAccent}`.trim()
      : "",
    npsEnabled: cfg?.npsEnabled ?? true,
    sections,
    testimonialPrompt: cfg?.testimonialPrompt || "El primer día vimos…",
    feedbackVersion: (fb.feedback_version as string) || cfg?.version || "v1",
  };
}
