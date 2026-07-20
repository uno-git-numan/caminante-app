// AGENDA GLOBAL de la cola de redes: qué días ya están ocupados, sin importar
// de qué campaña o experiencia. Es lo que vuelve GLOBAL al scheduler — antes
// cada campaña se calculaba sola y dos podían caer el mismo día.
//
// Solo LEE social_posts (no toca posts.ts ni publish.ts).
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { diaClave } from "@/lib/social/campana";

// Días con algo vivo en la cola (programado o publicándose). Los cancelados y
// fallidos NO ocupan: su día vuelve a estar libre.
export async function fetchBusyDates(desde: Date = new Date()): Promise<string[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("social_posts")
    .select("scheduled_at, status")
    .in("status", ["scheduled", "publishing"])
    .gte("scheduled_at", desde.toISOString());
  const dias = new Set<string>();
  for (const r of (data ?? []) as { scheduled_at: string | null }[]) {
    if (r.scheduled_at) dias.add(diaClave(new Date(r.scheduled_at)));
  }
  return [...dias];
}
