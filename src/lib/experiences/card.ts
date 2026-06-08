import type { Experience } from "./types";

export type ExperienceCard = {
  slug: string;
  title: string;
  ploc: string; // "lugar · fechas"
  hook: string;
  image: string;
  imageAlt: string;
  startDate: string | null;
};

// Derives the landing/calendar card from an experience, with sensible fallbacks.
export function toCard(e: Experience): ExperienceCard {
  const lugar =
    (e.heroMeta.find((x) => /lugar/i.test(x.k))?.v ?? "").split("\n").pop()?.trim() ?? "";
  const volTail = e.vol.replace(/^vol\.?\s*\d+\s*·\s*/i, "").trim();
  return {
    slug: e.slug,
    title: e.cardTitle || e.subtitle || `${e.title} ${e.titleAccent}`.trim(),
    ploc: e.cardPloc || [lugar, volTail].filter(Boolean).join(" · "),
    hook: e.cardHook || e.subtitle,
    image: e.heroImageUrl,
    imageAlt: e.heroImageAlt || "",
    startDate: e.startDate ?? null,
  };
}
