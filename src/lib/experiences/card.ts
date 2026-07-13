import type { Experience } from "./types";

export type ExperienceRating = { stars: number; count: number };

export type ExperienceCard = {
  slug: string;
  title: string;
  ploc: string; // "lugar · fechas"
  hook: string;
  image: string;
  imageAlt: string;
  startDate: string | null;
  estado: string; // estado de MX — las páginas de destino filtran por esto
  // Satisfacción real (promedio de overall_stars de encuestas respondidas). null =
  // aún sin encuestas → la UI muestra "Experiencia nueva". Lo adjunta la API/
  // servidor (toCard no tiene BD).
  rating?: ExperienceRating | null;
};

// Derives the landing/calendar card from an experience, with sensible fallbacks.
export function toCard(e: Experience): ExperienceCard {
  // Guards: el contenido rico es opcional (experiencias estáticas). La tarjeta se
  // arma con cardTitle/cardPloc/cardHook + portada (heroImageUrl), con fallbacks.
  const lugar =
    ((e.heroMeta ?? []).find((x) => /lugar/i.test(x.k))?.v ?? "").split("\n").pop()?.trim() ?? "";
  const volTail = (e.vol ?? "").replace(/^vol\.?\s*\d+\s*·\s*/i, "").trim();
  const fullTitle = `${e.title ?? ""} ${e.titleAccent ?? ""}`.trim();
  // Sin foto de tarjeta → usa la portada de la página v2 (experiencias bespoke
  // migradas nunca llenaron heroImageUrl).
  const heroBlock = (e.page?.blocks ?? []).find((b) => b.type === "hero");
  const heroBg = heroBlock && heroBlock.type === "hero" ? heroBlock.bg : undefined;
  return {
    slug: e.slug,
    title: e.cardTitle || e.subtitle || fullTitle,
    ploc: e.cardPloc || e.estado || [lugar, volTail].filter(Boolean).join(" · "),
    hook: e.cardHook || e.subtitle || "",
    image: e.heroImageUrl || heroBg?.url || "",
    imageAlt: e.heroImageAlt || heroBg?.alt || "",
    startDate: e.startDate ?? null,
    estado: e.estado ?? "",
  };
}
