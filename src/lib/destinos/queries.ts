import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Destino, DestinoContent } from "@/lib/destinos/types";

// Tarjeta de un destino para los listados ("Dónde caminamos"). Es lo que la
// tarjeta pinta y nada más: el resto del `content` solo lo necesita la página
// del destino. El título va partido igual que en el hero de esa página
// (heroTitle + heroAccent en itálica naranja).
export type DestinoCard = {
  estado: string; // canónico, p. ej. "Baja California Sur"
  slug: string; // → /caminante/destinos/<slug>
  titulo: string; // heroTitle; sin contenido cae al nombre del estado
  acento: string; // heroAccent (puede ir vacío)
  coord: string; // heroMeta, p. ej. "23.6°N · Golfo de California"
  imageUrl: string; // heroBgUrl; vacío = la tarjeta va sin foto (nunca una ajena)
  experiencias: number; // experiencias PUBLICADAS de ese estado
};

// Trae el destino publicado por slug. Usa service-role (server-only) y filtra
// is_published en código. Si la tabla aún no existe (migración sin aplicar) o no
// hay fila publicada → null, y el template cae en el fallback (hero + grilla +
// cierre). includeDraft = para la vista previa del admin (?draft=1) a futuro.
export async function fetchDestino(
  slug: string,
  { includeDraft = false }: { includeDraft?: boolean } = {},
): Promise<Destino | null> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("destinos")
      .select("estado, slug, is_published, content")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    if (!data.is_published && !includeDraft) return null;
    return {
      estado: String(data.estado),
      slug: String(data.slug),
      isPublished: Boolean(data.is_published),
      content: (data.content ?? {}) as DestinoContent,
    };
  } catch {
    return null; // tabla inexistente u otro error → fallback
  }
}

// Todos los destinos PUBLICADOS, con lo que la tarjeta necesita y el conteo de
// experiencias publicadas de ese estado. Mismo criterio que `fetchDestino`: si
// la tabla no existe o falla, devuelve [] y el listado se esconde (nunca se
// inventa un lugar). El conteo se cruza contra `experiences.data.estado`, que
// es el mismo campo con el que la página del destino arma su grilla.
export async function fetchDestinos(): Promise<DestinoCard[]> {
  try {
    const sb = createSupabaseAdminClient();
    const [{ data: rows, error }, { data: exps }] = await Promise.all([
      sb.from("destinos").select("estado, slug, is_published, content"),
      sb.from("experiences").select("data").eq("status", "published"),
    ]);
    if (error || !rows) return [];

    const conteo = new Map<string, number>();
    for (const e of (exps ?? []) as { data: { estado?: string } | null }[]) {
      const estado = e.data?.estado;
      if (estado) conteo.set(estado, (conteo.get(estado) ?? 0) + 1);
    }

    return rows
      .filter((r) => r.is_published)
      .map((r) => {
        const c = (r.content ?? {}) as DestinoContent;
        const estado = String(r.estado);
        return {
          estado,
          slug: String(r.slug),
          titulo: c.heroTitle || estado,
          acento: c.heroAccent || "",
          coord: c.heroMeta || "",
          imageUrl: c.heroBgUrl || "",
          experiencias: conteo.get(estado) ?? 0,
        };
      })
      .sort((a, b) => a.estado.localeCompare(b.estado, "es"));
  } catch {
    return []; // tabla inexistente u otro error → el bloque no se pinta
  }
}
