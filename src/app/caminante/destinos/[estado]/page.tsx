// Página de destino por estado (data-driven). /caminante/destinos/<slug>.
// Cualquier estado real de México resuelve; si tiene contenido publicado se ve
// completo, si no cae en el fallback (hero + grilla de experiencias + cierre).
// Un slug que no es un estado → 404.
import { notFound } from "next/navigation";
import { estadoFromSlug } from "@/lib/destinos/estado-slug";
import { fetchDestino } from "@/lib/destinos/queries";
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
  return <DestinoTemplate estado={estado} content={destino?.content ?? null} />;
}
