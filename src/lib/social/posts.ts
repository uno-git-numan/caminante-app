// Capa de datos de la cola de publicaciones (social_posts, 0026). Siempre con el
// service-role (RLS bloqueada). Registra publicaciones inmediatas, programa las
// futuras, y expone lo que el cron debe publicar.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SocialPost = {
  id: string;
  provider: string;
  experienceSlug: string | null;
  pieceId: string | null;
  format: "post" | "story";
  caption: string | null;
  imageUrls: string[];
  scheduledAt: string | null;
  status: "scheduled" | "publishing" | "published" | "failed" | "canceled";
  igMediaId: string | null;
  igPermalink: string | null;
  error: string | null;
  attempts: number;
  createdBy: string | null;
  createdAt: string;
  publishedAt: string | null;
};

type Row = {
  id: string;
  provider: string;
  experience_slug: string | null;
  piece_id: string | null;
  format: "post" | "story";
  caption: string | null;
  image_urls: string[] | null;
  scheduled_at: string | null;
  status: SocialPost["status"];
  ig_media_id: string | null;
  ig_permalink: string | null;
  error: string | null;
  attempts: number | null;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
};

function toPost(r: Row): SocialPost {
  return {
    id: r.id,
    provider: r.provider,
    experienceSlug: r.experience_slug,
    pieceId: r.piece_id,
    format: r.format,
    caption: r.caption,
    imageUrls: r.image_urls || [],
    scheduledAt: r.scheduled_at,
    status: r.status,
    igMediaId: r.ig_media_id,
    igPermalink: r.ig_permalink,
    error: r.error,
    attempts: r.attempts || 0,
    createdBy: r.created_by,
    createdAt: r.created_at,
    publishedAt: r.published_at,
  };
}

const SELECT = "id, provider, experience_slug, piece_id, format, caption, image_urls, scheduled_at, status, ig_media_id, ig_permalink, error, attempts, created_by, created_at, published_at";

type NewPost = {
  experienceSlug?: string | null;
  pieceId?: string | null;
  format: "post" | "story";
  caption?: string | null;
  imageUrls: string[];
  createdBy?: string | null;
};

// Registra una publicación que YA se intentó (inmediata).
export async function recordPost(
  input: NewPost & {
    status: "published" | "failed";
    igMediaId?: string | null;
    igPermalink?: string | null;
    error?: string | null;
  },
): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb.from("social_posts").insert({
    provider: "instagram",
    experience_slug: input.experienceSlug ?? null,
    piece_id: input.pieceId ?? null,
    format: input.format,
    caption: input.caption ?? null,
    image_urls: input.imageUrls,
    scheduled_at: null,
    status: input.status,
    ig_media_id: input.igMediaId ?? null,
    ig_permalink: input.igPermalink ?? null,
    error: input.error ?? null,
    attempts: 1,
    created_by: input.createdBy ?? null,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  });
}

// Programa una publicación futura.
export async function schedulePost(input: NewPost & { scheduledAt: string }): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb.from("social_posts").insert({
    provider: "instagram",
    experience_slug: input.experienceSlug ?? null,
    piece_id: input.pieceId ?? null,
    format: input.format,
    caption: input.caption ?? null,
    image_urls: input.imageUrls,
    scheduled_at: input.scheduledAt,
    status: "scheduled",
    created_by: input.createdBy ?? null,
  });
}

// Cancela una publicación programada (solo si sigue pendiente).
export async function cancelScheduledPost(id: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb.from("social_posts").update({ status: "canceled" }).eq("id", id).eq("status", "scheduled");
}

// Publicaciones vencidas listas para el cron (scheduled y ya llegó su fecha).
export async function fetchDuePosts(limit = 10): Promise<SocialPost[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("social_posts")
    .select(SELECT)
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);
  return ((data || []) as Row[]).map(toPost);
}

// El cron marca 'publishing' de forma atómica (solo si sigue 'scheduled') para no
// publicar dos veces si dos corridas se solapan.
export async function claimPost(id: string): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("social_posts")
    .update({ status: "publishing" })
    .eq("id", id)
    .eq("status", "scheduled")
    .select("id");
  return Array.isArray(data) && data.length > 0;
}

export async function markPublished(id: string, igMediaId: string, permalink?: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb
    .from("social_posts")
    .update({ status: "published", ig_media_id: igMediaId, ig_permalink: permalink ?? null, published_at: new Date().toISOString(), error: null })
    .eq("id", id);
}

export async function markFailed(id: string, error: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("social_posts").select("attempts").eq("id", id).maybeSingle();
  const attempts = ((data as { attempts: number | null } | null)?.attempts || 0) + 1;
  // Tras 3 intentos se queda 'failed'; antes vuelve a 'scheduled' para reintentar.
  await sb
    .from("social_posts")
    .update({ status: attempts >= 3 ? "failed" : "scheduled", error, attempts })
    .eq("id", id);
}

// Para el panel: programadas + histórico reciente.
export async function listRecentPosts(limit = 60): Promise<SocialPost[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("social_posts").select(SELECT).order("created_at", { ascending: false }).limit(limit);
  return ((data || []) as Row[]).map(toPost);
}

// Posts cuya fecha relevante (programada, publicada o creada) cae en [fromISO, toISO).
// Para la vista de calendario: cubre tanto lo programado a futuro como lo ya publicado.
export async function fetchPostsBetween(fromISO: string, toISO: string): Promise<SocialPost[]> {
  const sb = createSupabaseAdminClient();
  const range = (col: string) => `and(${col}.gte.${fromISO},${col}.lt.${toISO})`;
  const { data } = await sb
    .from("social_posts")
    .select(SELECT)
    .or([range("scheduled_at"), range("published_at"), range("created_at")].join(","))
    .order("scheduled_at", { ascending: true });
  return ((data || []) as Row[]).map(toPost);
}
