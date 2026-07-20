// CICLO DE VIDA de las piezas del kit en la cola de redes. Lee social_posts
// (piece_id + status) y devuelve, por pieza, su ÚLTIMA fila no cancelada — con
// eso el dashboard muestra «Programada 24 jul» / «Publicada» / «Falló» sin abrir
// el calendario.
//
// Vive en archivo PROPIO a propósito: lib/social/posts.ts es parte del camino
// crítico de publicación (campaña en vivo) y no se toca. Best-effort: si la
// tabla no existe o la consulta falla, el kit no se cae — devuelve mapa vacío
// (mismo patrón que los testimonios en kit/queries.ts).
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PiezaEnCola = {
  status: "scheduled" | "publishing" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  igPermalink: string | null;
  error: string | null;
};

export type EstadoCola = Record<string, PiezaEnCola>;

export async function fetchEstadoPiezas(slug: string): Promise<EstadoCola> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("social_posts")
      .select("piece_id, status, scheduled_at, published_at, ig_permalink, error, created_at")
      .eq("experience_slug", slug)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return {};
    const out: EstadoCola = {};
    for (const r of (data ?? []) as {
      piece_id: string | null;
      status: string;
      scheduled_at: string | null;
      published_at: string | null;
      ig_permalink: string | null;
      error: string | null;
    }[]) {
      if (!r.piece_id || out[r.piece_id]) continue; // ya tenemos la más reciente
      if (r.status === "canceled") continue; // una cancelada no es un estado vigente
      // La fila más reciente ES el estado vigente: reprogramar una pieza ya
      // publicada es volver a publicarla, así que el estado nuevo manda.
      out[r.piece_id] = {
        status: r.status as PiezaEnCola["status"],
        scheduledAt: r.scheduled_at,
        publishedAt: r.published_at,
        igPermalink: r.ig_permalink,
        error: r.error,
      };
    }
    return out;
  } catch {
    return {};
  }
}

// Fecha corta para las pills («24 jul 19:00» / «16 jul»), en hora de México.
export function fechaPill(iso: string | null, conHora: boolean): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const f = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", timeZone: "America/Mexico_City" });
    if (!conHora) return f;
    const h = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City" });
    return `${f} ${h}`;
  } catch {
    return "";
  }
}
