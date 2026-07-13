// Satisfacción REAL por experiencia, derivada de la encuesta (experience_feedback,
// respuestas 'submitted' con overall_stars). No se guarda nada — se calcula al
// vuelo. Sin encuestas → la experiencia no aparece en el mapa y la UI muestra
// "Experiencia nueva". Cliente admin (server-only) para no depender de RLS.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ExperienceRating } from "@/lib/experiences/card";

// Map de experience_id → { stars promedio (1 decimal), count de respuestas }.
export async function fetchExperienceRatings(): Promise<Map<string, ExperienceRating>> {
  const out = new Map<string, ExperienceRating>();
  try {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("experience_feedback")
      .select("experience_id, overall_stars")
      .eq("status", "submitted")
      .not("overall_stars", "is", null);
    const agg = new Map<string, number[]>();
    for (const r of (data ?? []) as { experience_id: string; overall_stars: number }[]) {
      const v = Number(r.overall_stars);
      if (!(v >= 1 && v <= 5) || !r.experience_id) continue;
      (agg.get(r.experience_id) ?? agg.set(r.experience_id, []).get(r.experience_id)!).push(v);
    }
    for (const [id, vals] of agg) {
      out.set(id, {
        stars: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        count: vals.length,
      });
    }
  } catch {
    // sin ratings → todas salen "Experiencia nueva"
  }
  return out;
}
