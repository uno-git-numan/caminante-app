// Página de destino por estado (data-driven). /caminante/destinos/<slug>.
// Cualquier estado real de México resuelve; si tiene contenido publicado se ve
// completo, si no cae en el fallback (hero + grilla de experiencias + cierre).
// Un slug que no es un estado → 404.
import { notFound } from "next/navigation";
import { estadoFromSlug } from "@/lib/destinos/estado-slug";
import { fetchDestino } from "@/lib/destinos/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import DestinoTemplate from "./DestinoTemplate";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ estado: string }> }) {
  const { estado: slug } = await params;
  const estado = estadoFromSlug(slug);
  if (!estado) return { title: "Destino · Caminante" };
  return {
    title: `${estado} · Caminante`,
    description: `Vive ${estado} con Caminante: naturaleza, conservación, comunidades y experiencias guiadas.`,
  };
}

export default async function DestinoPage({ params }: { params: Promise<{ estado: string }> }) {
  const { estado: slug } = await params;
  const estado = estadoFromSlug(slug);
  if (!estado) notFound();

  const destino = await fetchDestino(slug);
  let content = destino?.content ?? null;

  // La "experiencia destacada" solo se muestra si la experiencia está PUBLICADA:
  // así su botón "Vivir esta experiencia" nunca apunta a un borrador (404).
  if (content?.featured?.slug) {
    try {
      const sb = createSupabaseAdminClient();
      const { data } = await sb
        .from("experiences")
        .select("status")
        .eq("slug", content.featured.slug)
        .maybeSingle();
      if (data?.status !== "published") content = { ...content, featured: null };
    } catch {
      content = { ...content, featured: null };
    }
  }

  return <DestinoTemplate estado={estado} content={content} />;
}
