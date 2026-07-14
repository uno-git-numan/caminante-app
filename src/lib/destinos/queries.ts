import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Destino, DestinoContent } from "@/lib/destinos/types";

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
