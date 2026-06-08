import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchExperienceBySlug } from "@/lib/experiences/queries";
import ExperienceTemplate from "./ExperienceTemplate";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const e = await fetchExperienceBySlug(slug);
  return { title: e ? e.docTitle : "Experiencia · Caminante" };
}

export default async function ExperiencePage({ params }: Params) {
  const { slug } = await params;
  const e = await fetchExperienceBySlug(slug);
  if (!e || e.status !== "published") notFound();
  return <ExperienceTemplate experience={e} />;
}
