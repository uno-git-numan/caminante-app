import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchExperienceBySlug,
  fetchPublishedExperienceRow,
} from "@/lib/experiences/queries";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import ExperienceTemplate from "./ExperienceTemplate";
import ExperienceTemplateV2 from "./ExperienceTemplateV2";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const e = await fetchExperienceBySlug(slug);
  const title = e?.page?.docTitle || e?.docTitle;
  return { title: title || "Experiencia · Caminante" };
}

export default async function ExperiencePage({ params }: Params) {
  const { slug } = await params;

  // Diseño v2 (bespoke ensenada/hongos, data-driven): necesita el id de la fila
  // para leer sus salidas y pintar las fechas en vivo.
  const row = await fetchPublishedExperienceRow(slug);
  if (row?.experience.design === "v2") {
    const slots = await fetchOpenSlotsForTemplate(row.id);
    return <ExperienceTemplateV2 experience={row.experience} slots={slots} />;
  }

  // Template legacy (4 caras/contexto/impacto).
  const e = row?.experience ?? (await fetchExperienceBySlug(slug));
  if (!e || e.status !== "published") notFound();
  return <ExperienceTemplate experience={e} />;
}
