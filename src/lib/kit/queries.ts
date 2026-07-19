import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import type { Experience, PageBlock } from "@/lib/experiences/types";
import type { KitContext } from "@/lib/kit/kit";

const SITE = "https://caminante.numanhub.com";

function iniciales(nombre: string): string {
  const parts = (nombre || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

// Arma el contexto del kit para una experiencia (funciona en borrador o publicada).
// Fotos = galería de "Lo básico"; testimonios = solo aprobados CON consentimiento;
// disponibilidad = salidas públicas abiertas.
export async function fetchKitContext(slug: string): Promise<KitContext | null> {
  const sb = createSupabaseAdminClient();
  const { data: row } = await sb.from("experiences").select("id, slug, data").eq("slug", slug).maybeSingle();
  if (!row) return null;
  const exp = { ...(row.data as Experience), slug: row.slug as string };
  const blocks: PageBlock[] = exp.page?.blocks ?? [];
  const gallery = (exp.gallery ?? []).filter((u) => typeof u === "string" && u.trim());

  // Testimonios publicables (moderados + con consentimiento) de esta experiencia.
  const quotes: KitContext["quotes"] = [];
  try {
    const { data: fb } = await sb
      .from("experience_feedback")
      .select("testimonial_text, testimonial_stars, testimonial_consent, publish_status, contact_id")
      .eq("experience_id", row.id as string)
      .eq("testimonial_consent", true)
      .eq("publish_status", "approved");
    const rows = (fb ?? []) as {
      testimonial_text: string | null;
      testimonial_stars: number | null;
      contact_id: string;
    }[];
    const ids = [...new Set(rows.map((r) => r.contact_id).filter(Boolean))];
    const nameById = new Map<string, string>();
    if (ids.length) {
      const { data: cs } = await sb.from("contacts").select("id, full_name").in("id", ids);
      for (const c of (cs ?? []) as { id: string; full_name: string | null }[]) nameById.set(c.id, c.full_name || "");
    }
    for (const r of rows) {
      const t = (r.testimonial_text || "").trim();
      if (t) quotes.push({ text: t, author: iniciales(nameById.get(r.contact_id) || ""), stars: r.testimonial_stars });
    }
  } catch {
    /* tabla/columnas ausentes → sin testimonios (P8 pendiente) */
  }

  // Salidas públicas abiertas (label + cupo disponible).
  let slots: KitContext["slots"] = [];
  try {
    const open = await fetchOpenSlotsForTemplate(row.id as string);
    slots = open.map((s) => ({ label: s.label, available: s.available }));
  } catch {
    slots = [];
  }

  return {
    exp,
    blocks,
    gallery,
    quotes,
    slots,
    // Banco de fotos tipificado + ficha científica (serie E). null = no capturados.
    photoBank: exp.photoBank ?? null,
    ficha: exp.ficha ?? null,
    reservarUrl: `${SITE}/caminante/reservar/${slug}`,
    expUrl: `${SITE}/caminante/experiencias/${slug}`,
  };
}
