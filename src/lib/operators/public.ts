// Perfil PÚBLICO de operadores (migración 0020). Dos consumidores:
//   - el chip "Operada por" en el hero de cada experiencia (fetchOperatorChip)
//   - la página /caminante/operador/[slug] (fetchOperatorProfile)
// Las MÉTRICAS se derivan en vivo: reservas pagadas (operator_id, 0016) y la
// encuesta (experience_feedback). Todo best-effort: si la migración 0020 aún no
// está aplicada o algo falla, se devuelve null y la página vive sin el chip.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toCard, type ExperienceCard } from "@/lib/experiences/card";
import { fetchExperienceRatings } from "@/lib/experiences/ratings";
import type { Experience } from "@/lib/experiences/types";

export type OperatorChip = {
  slug: string;
  name: string;
  photoUrl: string | null;
  stars: number | null; // promedio de overall_stars (encuestas respondidas); null = sin datos
};

export type TeamMember = {
  name: string;
  role: string; // vocación/profesión
  quote: string;
  photoUrl: string;
};

export type OperatorProfile = {
  slug: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  heroPhotoUrl: string | null; // foto de naturaleza de fondo del hero
  instagram: string | null;
  team: TeamMember[];
  isPublic: boolean;
  since: string; // created_at (ISO) — "opera desde"
  metrics: {
    salidas: number; // salidas pasadas con al menos una reserva pagada
    viajeros: number; // Σ num_people de reservas pagadas/completadas
    stars: number | null; // satisfacción promedio (1-5)
    encuestas: number; // cuántas respuestas sostienen el promedio
    volveria: number | null; // % rebook_interest entre respondidas
  };
  experiencias: ExperienceCard[]; // publicadas del operador
  testimonios: { text: string; stars: number | null; initials: string; location: string }[];
};

// Iniciales para firmar testimonios (regla: solo con iniciales, jamás nombre completo).
function initialsOf(fullName: string | null | undefined): string {
  return (fullName || "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => (w[0] || "").toUpperCase() + ".")
    .join("");
}

type FeedbackRow = {
  overall_stars: number | null;
  rebook_interest: boolean | null;
};

// Satisfacción del operador: respuestas submitted de reservas atribuidas a él.
async function feedbackDelOperador(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  operatorId: string,
): Promise<FeedbackRow[]> {
  const { data } = await sb
    .from("experience_feedback")
    .select("overall_stars, rebook_interest, reservations!inner(operator_id)")
    .eq("reservations.operator_id", operatorId)
    .eq("status", "submitted");
  return (data ?? []) as unknown as FeedbackRow[];
}

function promedioStars(rows: FeedbackRow[]): { stars: number | null; n: number } {
  const vals = rows.map((r) => Number(r.overall_stars)).filter((v) => v >= 1 && v <= 5);
  if (!vals.length) return { stars: null, n: 0 };
  return { stars: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10, n: vals.length };
}

// Chip del hero: nombre + ★ (la estrella solo si hay encuestas). Null si el
// operador no existe, no es público o la migración no está aplicada.
export async function fetchOperatorChip(operatorId: string | null): Promise<OperatorChip | null> {
  if (!operatorId) return null;
  try {
    const sb = createSupabaseAdminClient();
    const { data: op, error } = await sb
      .from("operators")
      .select("slug, name, photo_url, is_public")
      .eq("id", operatorId)
      .maybeSingle();
    if (error || !op?.is_public || !op.slug) return null;
    const { stars } = promedioStars(await feedbackDelOperador(sb, operatorId));
    return {
      slug: op.slug as string,
      name: op.name as string,
      photoUrl: (op.photo_url as string | null) ?? null,
      stars,
    };
  } catch {
    return null;
  }
}

// Chip a partir de la EXPERIENCIA (el template no conoce operator_id).
export async function fetchOperatorChipForExperience(
  experienceId: string,
): Promise<OperatorChip | null> {
  try {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("experiences")
      .select("operator_id")
      .eq("id", experienceId)
      .maybeSingle();
    return fetchOperatorChip((data?.operator_id as string | null) ?? null);
  } catch {
    return null;
  }
}

// Perfil completo para /caminante/operador/[slug]. Null → notFound().
export async function fetchOperatorProfile(
  slug: string,
  opts?: { includeDraft?: boolean }, // true = vista previa admin aunque no sea público
): Promise<OperatorProfile | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const sb = createSupabaseAdminClient();
    const { data: op, error } = await sb
      .from("operators")
      .select("id, slug, name, bio, photo_url, hero_photo_url, instagram, team, is_public, created_at")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !op) return null;
    if (!op.is_public && !opts?.includeDraft) return null;
    const operatorId = op.id as string;

    // Reservas pagadas/completadas del operador → viajeros + salidas con venta.
    const { data: resvs } = await sb
      .from("reservations")
      .select("num_people, status, slot_id")
      .eq("operator_id", operatorId)
      .in("status", ["paid", "completed"]);
    const pagadas = (resvs ?? []) as { num_people: number; slot_id: string | null }[];
    const viajeros = pagadas.reduce((n, r) => n + (Number(r.num_people) || 0), 0);
    const slotIds = [...new Set(pagadas.map((r) => r.slot_id).filter(Boolean))] as string[];

    // Salidas OPERADAS = de esas, las que ya ocurrieron (starts_at en el pasado).
    let salidas = 0;
    if (slotIds.length) {
      const { count } = await sb
        .from("experience_slots")
        .select("id", { count: "exact", head: true })
        .in("id", slotIds)
        .lt("starts_at", new Date().toISOString());
      salidas = count ?? 0;
    }

    // Satisfacción + % volvería (encuesta).
    const fb = await feedbackDelOperador(sb, operatorId);
    const { stars, n: encuestas } = promedioStars(fb);
    const conRespuesta = fb.length;
    const volveria = conRespuesta
      ? Math.round((fb.filter((r) => r.rebook_interest === true).length / conRespuesta) * 100)
      : null;

    // Experiencias publicadas del operador (tarjetas) + su satisfacción real.
    const { data: exps } = await sb
      .from("experiences")
      .select("id, data")
      .eq("operator_id", operatorId)
      .eq("status", "published");
    const ratings = await fetchExperienceRatings();
    const experiencias = ((exps ?? []) as { id: string; data: Experience }[])
      .map((r) => ({ ...toCard(r.data), rating: ratings.get(r.id) ?? null }))
      .filter((c) => c.title);

    // Testimonios: SOLO aprobados en el panel de Encuesta (consentimiento + firma
    // con iniciales — jamás el nombre completo).
    const { data: testis } = await sb
      .from("experience_feedback")
      .select(
        "testimonial_text, testimonial_stars, location_label, reservations!inner(operator_id), contacts(full_name)",
      )
      .eq("reservations.operator_id", operatorId)
      .eq("publish_status", "approved")
      .eq("testimonial_consent", true)
      .order("submitted_at", { ascending: false })
      .limit(12);
    const testimonios = ((testis ?? []) as unknown as {
      testimonial_text: string | null;
      testimonial_stars: number | null;
      location_label: string | null;
      contacts: { full_name: string | null } | null;
    }[])
      .filter((t) => (t.testimonial_text || "").trim())
      .map((t) => ({
        text: (t.testimonial_text as string).trim(),
        stars: t.testimonial_stars,
        initials: initialsOf(t.contacts?.full_name),
        location: t.location_label || "",
      }));

    const teamRaw = Array.isArray(op.team) ? (op.team as Partial<TeamMember>[]) : [];
    const team: TeamMember[] = teamRaw
      .filter((t) => (t?.name || "").toString().trim())
      .map((t) => ({
        name: String(t.name ?? "").trim(),
        role: String(t.role ?? "").trim(),
        quote: String(t.quote ?? "").trim(),
        photoUrl: String(t.photoUrl ?? "").trim(),
      }));
    return {
      slug: op.slug as string,
      name: op.name as string,
      bio: (op.bio as string | null) ?? null,
      photoUrl: (op.photo_url as string | null) ?? null,
      heroPhotoUrl: (op.hero_photo_url as string | null) ?? null,
      instagram: (op.instagram as string | null) ?? null,
      team,
      isPublic: !!op.is_public,
      since: op.created_at as string,
      metrics: { salidas, viajeros, stars, encuestas, volveria },
      experiencias,
      testimonios,
    };
  } catch {
    return null;
  }
}
