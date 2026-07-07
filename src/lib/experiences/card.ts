import type { Experience } from "./types";

export type ExperienceCard = {
  slug: string;
  title: string;
  ploc: string; // "lugar · fechas"
  hook: string;
  image: string;
  imageAlt: string;
  startDate: string | null;
  estado: string; // estado de MX — las páginas de destino filtran por esto
};

// Derives the landing/calendar card from an experience, with sensible fallbacks.
export function toCard(e: Experience): ExperienceCard {
  // Guards: el contenido rico es opcional (experiencias estáticas). La tarjeta se
  // arma con cardTitle/cardPloc/cardHook + portada (heroImageUrl), con fallbacks.
  const lugar =
    ((e.heroMeta ?? []).find((x) => /lugar/i.test(x.k))?.v ?? "").split("\n").pop()?.trim() ?? "";
  const volTail = (e.vol ?? "").replace(/^vol\.?\s*\d+\s*·\s*/i, "").trim();
  const fullTitle = `${e.title ?? ""} ${e.titleAccent ?? ""}`.trim();
  return {
    slug: e.slug,
    title: e.cardTitle || e.subtitle || fullTitle,
    ploc: e.cardPloc || e.estado || [lugar, volTail].filter(Boolean).join(" · "),
    hook: e.cardHook || e.subtitle || "",
    image: e.heroImageUrl ?? "",
    imageAlt: e.heroImageAlt || "",
    startDate: e.startDate ?? null,
    estado: e.estado ?? "",
  };
}
