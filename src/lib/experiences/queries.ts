import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getExperienceBySlug as seedBySlug,
  getAllExperiences as seedAll,
} from "./data";
import type { Experience } from "./types";

// Reads from Supabase (the source of truth once seeded). Falls back to the in-code
// seed data so pages keep working before the table is populated or if the DB is down.

export async function fetchExperienceBySlug(slug: string): Promise<Experience | null> {
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("experiences")
      .select("data, status")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data?.data) return data.data as Experience;
  } catch {
    // ignore — fall back to seed
  }
  return seedBySlug(slug);
}

// Igual que fetchExperienceBySlug pero devuelve también el id de la fila (para
// consultar sus salidas). Solo experiencias publicadas; sin fallback al seed
// (el seed no tiene id de BD). Lo usa la página pública del diseño v2.
export async function fetchPublishedExperienceRow(
  slug: string,
): Promise<{ id: string; experience: Experience } | null> {
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("experiences")
      .select("id, data, status")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!error && data?.data) {
      return { id: (data as { id: string }).id, experience: data.data as Experience };
    }
  } catch {
    // ignore
  }
  return null;
}

// Igual que fetchPublishedExperiences pero conserva el id de fila — necesario
// para unir métricas por experiencia (p.ej. la satisfacción de la encuesta).
// Sin BD/seed no aplica (el seed no tiene ids), devuelve [].
export async function fetchPublishedExperienceRows(): Promise<{ id: string; data: Experience }[]> {
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("experiences")
      .select("id, data")
      .eq("status", "published");
    if (!error && data) {
      return (data as { id: string; data: Experience }[]).map((r) => ({ id: r.id, data: r.data }));
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchPublishedExperiences(): Promise<Experience[]> {
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb
      .from("experiences")
      .select("data")
      .eq("status", "published");
    if (!error && data && data.length > 0) {
      return data.map((row) => row.data as Experience);
    }
  } catch {
    // ignore — fall back to seed
  }
  return seedAll();
}
