"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FeedbackInput, FeedbackResult, SectionRating } from "./types";

// estrellas con medias: snap al 0.5 más cercano dentro de [1,5], o null
const clampStars = (n: unknown): number | null => {
  const v = Math.round(Number(n) * 2) / 2;
  return v >= 1 && v <= 5 ? v : null;
};

// Guarda la respuesta de la encuesta. Acceso por token (sin login): la fila ya
// existe (status 'invited'); aquí la llenamos y la marcamos 'submitted'. Reenviar
// = sobrescribe (no es append-only). Encola al CRM solo datos COMERCIALES.
export async function submitFeedback(
  input: FeedbackInput,
): Promise<FeedbackResult> {
  if (!input.token) return { ok: false, error: "Falta el identificador de la encuesta." };
  const overall = clampStars(input.overallStars);
  if (!overall) return { ok: false, error: "Elige cuántas estrellas le das a tu experiencia." };

  const sb = createSupabaseAdminClient();
  const { data: fb } = await sb
    .from("experience_feedback")
    .select("id, status, contact_id, reservation_id, location_label, source")
    .eq("token", input.token)
    .maybeSingle();
  if (!fb) return { ok: false, error: "Esta encuesta ya no está disponible." };
  const alreadySubmitted = fb.status === "submitted";

  // sanea el desglose (solo secciones con estrellas válidas)
  const sectionRatings: Record<string, SectionRating> = {};
  for (const [k, v] of Object.entries(input.sectionRatings || {})) {
    const stars = clampStars(v?.stars);
    if (stars) {
      const comment = (v.comment || "").trim();
      sectionRatings[k] = comment ? { stars, comment } : { stars };
    }
  }

  const nps =
    input.nps != null && input.nps >= 0 && input.nps <= 10 ? Math.round(input.nps) : null;
  const testimonial = (input.testimonialText || "").trim();
  const wantsTestimonial = input.testimonialConsent && testimonial.length > 0;

  const { error } = await sb
    .from("experience_feedback")
    .update({
      status: "submitted",
      // ⚠️ NO pisar 'abierta': es la única marca de que la persona llegó por el
      // link del grupo (un acompañante que no compró). Pisarla a "web" borraba
      // la procedencia justo al responder — detectado al probar el 8 ago 2026.
      source: fb.source === "abierta" ? "abierta" : "web",
      submitted_at: new Date().toISOString(),
      overall_stars: overall,
      nps,
      section_ratings: sectionRatings,
      loved_text: (input.lovedText || "").trim() || null,
      improve_text: (input.improveText || "").trim() || null,
      expected_gap_text: (input.expectedGapText || "").trim() || null,
      rebook_interest: !!input.rebookInterest,
      testimonial_text: testimonial || null,
      testimonial_stars: clampStars(input.testimonialStars) ?? overall,
      testimonial_consent: !!input.testimonialConsent,
      photo_consent: !!input.photoConsent,
      // solo entra a la cola de "por aprobar" si hay texto Y permiso
      publish_status: wantsTestimonial ? "pending" : "none",
    })
    .eq("id", fb.id);
  if (error) return { ok: false, error: error.message };

  // CRM: el skill /sincronizar-registros tomará esto para escribir Satisfaction
  // y Would Refer en la entrada del Trip Pipeline. NADA sensible va a Notion.
  if (!alreadySubmitted) {
    await sb.from("notion_sync_log").insert({
      entity: "feedback",
      entity_id: fb.reservation_id,
      action: "feedback_submitted",
      status: "pending",
      payload: {
        contact_id: fb.contact_id,
        location_label: fb.location_label,
        overall_stars: overall,
        nps,
        would_refer: nps != null ? nps >= 9 : overall >= 4,
        rebook_interest: !!input.rebookInterest,
        has_testimonial: wantsTestimonial,
      },
    });
  }

  return { ok: true, alreadySubmitted };
}
