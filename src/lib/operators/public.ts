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

// Ajuste de encuadre no destructivo: zoom (1..3) + punto focal x/y (0..100 %).
export type PhotoAdjust = { zoom: number; x: number; y: number };

export type TeamMember = {
  name: string;
  role: string; // vocación/profesión
  quote: string;
  photoUrl: string;
  adjust: PhotoAdjust | null;
};

export type OperatorProfile = {
  slug: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  photoAdjust: PhotoAdjust | null;
  heroPhotoUrl: string | null; // foto de naturaleza de fondo del hero
  heroAdjust: PhotoAdjust | null;
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
  testimonios: Testimonio[];
};

/** Un testimonio publicable. La firma va con INICIALES, nunca el nombre. */
export type Testimonio = {
  text: string;
  stars: number | null;
  initials: string;
  location: string;
};

/** Operador en un LISTADO (portada). Lo que la tarjeta pinta y nada más. */
export type OperadorCard = {
  slug: string; // → /caminante/operador/<slug>
  name: string;
  bio: string | null;
  photoUrl: string | null;
  experiencias: number; // publicadas que opera
};

// Sanea un ajuste de encuadre venido de la BD (o null).
export function cleanAdjust(raw: unknown): PhotoAdjust | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const num = (v: unknown, min: number, max: number, def: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  const zoom = num(a.zoom, 1, 4, 1);
  const x = num(a.x, -150, 150, 0);
  const y = num(a.y, -150, 150, 0);
  if (zoom === 1 && x === 0 && y === 0) return null; // sin ajuste
  return { zoom, x, y };
}

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

type TestimonioRow = {
  testimonial_text: string | null;
  testimonial_stars: number | null;
  location_label: string | null;
  contacts: { full_name: string | null } | null;
};

// Testimonios publicables. UN SOLO filtro para todos los consumidores (perfil de
// operador y portada): `publish_status='approved'` **y** `testimonial_consent=true`
// — las dos condiciones, y la firma siempre con iniciales. `expIds = null` = sin
// acotar por experiencia (los de toda la plataforma).
async function testimoniosDe(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  expIds: string[] | null,
  limit: number,
): Promise<Testimonio[]> {
  let q = sb
    .from("experience_feedback")
    .select("testimonial_text, testimonial_stars, location_label, contacts(full_name)")
    .eq("publish_status", "approved")
    .eq("testimonial_consent", true)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (expIds) q = q.in("experience_id", expIds);
  const { data } = await q;
  return ((data ?? []) as unknown as TestimonioRow[])
    .filter((t) => (t.testimonial_text || "").trim())
    .map((t) => ({
      text: (t.testimonial_text as string).trim(),
      stars: t.testimonial_stars,
      initials: initialsOf(t.contacts?.full_name),
      location: t.location_label || "",
    }));
}

/**
 * Testimonios para una pantalla PÚBLICA que no es de un operador (la portada).
 * Mismo filtro y misma forma que los del perfil de operador — comparten
 * `testimoniosDe`, así que no pueden divergir. Best-effort: ante cualquier
 * error devuelve [] y la sección se cae con su estado vacío.
 */
export async function fetchTestimoniosPublicos(limit = 3): Promise<Testimonio[]> {
  try {
    return await testimoniosDe(createSupabaseAdminClient(), null, limit);
  } catch {
    return [];
  }
}

/**
 * Operadores PÚBLICOS (`is_public`) con lo que pide un listado: nombre, bio y
 * cuántas experiencias publicadas operan. Hasta ahora solo existían
 * `fetchOperatorChip` (uno, por id) y `fetchOperatorProfile` (uno, por slug).
 *
 * El conteo se cruza contra `experiences.operator_id` (0016) filtrando por
 * `status='published'` — es el mismo criterio con el que el perfil arma su
 * grilla, para que la tarjeta no prometa un número que la página desmiente.
 * Sin slug no hay a dónde enlazar, así que esos quedan fuera.
 */
export async function fetchOperadores(): Promise<OperadorCard[]> {
  try {
    const sb = createSupabaseAdminClient();
    const [{ data: ops, error }, { data: exps }] = await Promise.all([
      sb
        .from("operators")
        .select("id, slug, name, bio, photo_url, is_public")
        .eq("is_public", true)
        .order("name", { ascending: true }),
      sb.from("experiences").select("operator_id").eq("status", "published"),
    ]);
    if (error || !ops) return [];

    const conteo = new Map<string, number>();
    for (const e of (exps ?? []) as { operator_id: string | null }[]) {
      if (e.operator_id) conteo.set(e.operator_id, (conteo.get(e.operator_id) ?? 0) + 1);
    }

    return (ops as {
      id: string;
      slug: string | null;
      name: string | null;
      bio: string | null;
      photo_url: string | null;
    }[])
      .filter((o) => o.slug && o.name)
      .map((o) => ({
        slug: o.slug as string,
        name: o.name as string,
        bio: (o.bio || "").trim() || null,
        photoUrl: (o.photo_url || "").trim() || null,
        experiencias: conteo.get(o.id) ?? 0,
      }));
  } catch {
    return []; // migración 0020 sin aplicar u otro error → la sección se esconde
  }
}

// IDs de las experiencias que OPERA (dueño = operator_id). Fuente de verdad de
// la atribución: las reservas viejas (junio, pre-0016) no traen operator_id en
// la reserva, pero SÍ pertenecen a una experiencia del operador.
async function expIdsOfOperator(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  operatorId: string,
): Promise<string[]> {
  const { data } = await sb.from("experiences").select("id").eq("operator_id", operatorId);
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

// Satisfacción del operador: respuestas submitted de sus experiencias.
async function feedbackByExperiences(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  expIds: string[],
): Promise<FeedbackRow[]> {
  if (!expIds.length) return [];
  const { data } = await sb
    .from("experience_feedback")
    .select("overall_stars, rebook_interest")
    .in("experience_id", expIds)
    .eq("status", "submitted");
  return (data ?? []) as FeedbackRow[];
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
    const expIds = await expIdsOfOperator(sb, operatorId);
    const { stars } = promedioStars(await feedbackByExperiences(sb, expIds));
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
      .select("id, slug, name, bio, photo_url, photo_adjust, hero_photo_url, hero_adjust, instagram, team, is_public, created_at")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !op) return null;
    if (!op.is_public && !opts?.includeDraft) return null;
    const operatorId = op.id as string;
    const expIds = await expIdsOfOperator(sb, operatorId);

    // Reservas pagadas/completadas de SUS EXPERIENCIAS → viajeros + salidas. Se
    // atribuye por dueño de la experiencia (no por el snapshot de la reserva,
    // que falta en las ventas de junio pre-0016).
    const { data: resvs } = expIds.length
      ? await sb
          .from("reservations")
          .select("num_people, status, slot_id")
          .in("experience_id", expIds)
          .in("status", ["paid", "completed"])
      : { data: [] };
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
    const fb = await feedbackByExperiences(sb, expIds);
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
    const testimonios = expIds.length ? await testimoniosDe(sb, expIds, 12) : [];

    const teamRaw = Array.isArray(op.team) ? (op.team as Partial<TeamMember>[]) : [];
    const team: TeamMember[] = teamRaw
      .filter((t) => (t?.name || "").toString().trim())
      .map((t) => ({
        name: String(t.name ?? "").trim(),
        role: String(t.role ?? "").trim(),
        quote: String(t.quote ?? "").trim(),
        photoUrl: String(t.photoUrl ?? "").trim(),
        adjust: cleanAdjust((t as { adjust?: unknown }).adjust),
      }));
    return {
      slug: op.slug as string,
      name: op.name as string,
      bio: (op.bio as string | null) ?? null,
      photoUrl: (op.photo_url as string | null) ?? null,
      photoAdjust: cleanAdjust(op.photo_adjust),
      heroPhotoUrl: (op.hero_photo_url as string | null) ?? null,
      heroAdjust: cleanAdjust(op.hero_adjust),
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
