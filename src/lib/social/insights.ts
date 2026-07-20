// MÉTRICAS DE INSTAGRAM — el loop de "medir y replicar" del playbook (§8).
// Lee las publicaciones YA publicadas de la cola, le pide a la Graph API sus
// números y los guarda en social_insights (0027).
//
// Reglas de convivencia (la campaña de Hongos corre en vivo):
//   · NO toca social_posts ni publish.ts: solo LEE la cola y escribe su tabla.
//   · Todo es best-effort: si la API falla, se registra y se sigue. Jamás
//     rompe una publicación ni el cron de publicar (son rutas distintas).
//   · Métrica ausente = null (la API no la dio), que NO es lo mismo que 0.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const GRAPH = "https://graph.instagram.com";

export type PostInsight = {
  postId: string;
  pieceId: string | null;
  experienceSlug: string | null;
  publishedAt: string | null;
  permalink: string | null;
  likes: number | null;
  comments: number | null;
  saved: number | null;
  reach: number | null;
};

// Token de la cuenta conectada. Vive en social_accounts y NUNCA sale del server.
async function tokenDeLaCuenta(): Promise<{ token: string } | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("social_accounts")
    .select("access_token, status")
    .eq("provider", "instagram")
    .eq("status", "connected")
    .maybeSingle();
  const token = (data as { access_token?: string } | null)?.access_token;
  return token ? { token } : null;
}

// Números de UNA publicación. La Graph API los sirve en dos lugares distintos:
// like_count/comments_count son campos del media; saved/reach son "insights".
async function fetchMediaMetrics(
  igMediaId: string,
  token: string,
): Promise<{ likes: number | null; comments: number | null; saved: number | null; reach: number | null }> {
  const out = { likes: null as number | null, comments: null as number | null, saved: null as number | null, reach: null as number | null };
  try {
    const r = await fetch(`${GRAPH}/${igMediaId}?fields=like_count,comments_count&access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(() => null);
    if (r.ok && j) {
      out.likes = typeof j.like_count === "number" ? j.like_count : null;
      out.comments = typeof j.comments_count === "number" ? j.comments_count : null;
    }
  } catch {
    /* best-effort */
  }
  try {
    const r = await fetch(`${GRAPH}/${igMediaId}/insights?metric=saved,reach&access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(() => null);
    for (const m of (j?.data ?? []) as { name: string; values?: { value: number }[] }[]) {
      const v = m.values?.[0]?.value;
      if (typeof v !== "number") continue;
      if (m.name === "saved") out.saved = v;
      if (m.name === "reach") out.reach = v;
    }
  } catch {
    /* best-effort */
  }
  return out;
}

// Refresca las métricas de las publicaciones recientes (por defecto, lo
// publicado en los últimos 60 días: IG deja de mover los números viejos).
export async function refreshInsights(dias = 60): Promise<{ revisadas: number; guardadas: number; sinCuenta?: boolean }> {
  const cuenta = await tokenDeLaCuenta();
  if (!cuenta) return { revisadas: 0, guardadas: 0, sinCuenta: true };

  const sb = createSupabaseAdminClient();
  const desde = new Date(Date.now() - dias * 86400000).toISOString();
  const { data } = await sb
    .from("social_posts")
    .select("id, ig_media_id, published_at")
    .eq("status", "published")
    .not("ig_media_id", "is", null)
    .gte("published_at", desde);

  const posts = (data ?? []) as { id: string; ig_media_id: string }[];
  let guardadas = 0;
  for (const p of posts) {
    const m = await fetchMediaMetrics(p.ig_media_id, cuenta.token);
    // Si la API no devolvió NADA, no pisamos lo que ya teníamos con nulls.
    if (m.likes === null && m.comments === null && m.saved === null && m.reach === null) continue;
    const { error } = await sb
      .from("social_insights")
      .upsert({ post_id: p.id, ig_media_id: p.ig_media_id, ...m, fetched_at: new Date().toISOString() }, { onConflict: "post_id" });
    if (!error) guardadas++;
  }
  return { revisadas: posts.length, guardadas };
}

// Lo publicado CON sus números, lo más reciente primero. Es la materia prima de
// «Qué está funcionando» y del reporte semanal.
export async function fetchInsights(dias = 90): Promise<PostInsight[]> {
  const sb = createSupabaseAdminClient();
  const desde = new Date(Date.now() - dias * 86400000).toISOString();
  const { data } = await sb
    .from("social_posts")
    .select("id, piece_id, experience_slug, published_at, ig_permalink, social_insights(likes, comments, saved, reach)")
    .eq("status", "published")
    .gte("published_at", desde)
    .order("published_at", { ascending: false });

  type Row = {
    id: string;
    piece_id: string | null;
    experience_slug: string | null;
    published_at: string | null;
    ig_permalink: string | null;
    social_insights: { likes: number | null; comments: number | null; saved: number | null; reach: number | null }[] | null;
  };
  return ((data ?? []) as Row[]).map((r) => {
    const i = r.social_insights?.[0];
    return {
      postId: r.id,
      pieceId: r.piece_id,
      experienceSlug: r.experience_slug,
      publishedAt: r.published_at,
      permalink: r.ig_permalink,
      likes: i?.likes ?? null,
      comments: i?.comments ?? null,
      saved: i?.saved ?? null,
      reach: i?.reach ?? null,
    };
  });
}

// "Interacción" para ordenar: comentarios y saves pesan más que likes porque
// son las señales que el algoritmo premia (playbook §2, técnicas 1 y 3).
export function puntaje(i: PostInsight): number {
  return (i.likes ?? 0) + (i.comments ?? 0) * 3 + (i.saved ?? 0) * 3;
}

export type PiezaRendimiento = {
  pieceId: string;
  publicaciones: number;
  likes: number;
  comments: number;
  saved: number;
  puntajeMedio: number;
};

// QUÉ ESTÁ FUNCIONANDO: promedio por TIPO de pieza (P2 vs E3…), que es la
// pregunta útil del playbook — no qué post suelto pegó, sino qué formato repetir.
export function rendimientoPorPieza(insights: PostInsight[]): PiezaRendimiento[] {
  const acc = new Map<string, { n: number; likes: number; comments: number; saved: number; pts: number }>();
  for (const i of insights) {
    if (!i.pieceId) continue;
    // Sin métricas todavía (recién publicada o cron sin correr) → no promedia.
    if (i.likes === null && i.comments === null && i.saved === null) continue;
    const a = acc.get(i.pieceId) ?? { n: 0, likes: 0, comments: 0, saved: 0, pts: 0 };
    a.n++;
    a.likes += i.likes ?? 0;
    a.comments += i.comments ?? 0;
    a.saved += i.saved ?? 0;
    a.pts += puntaje(i);
    acc.set(i.pieceId, a);
  }
  return [...acc.entries()]
    .map(([pieceId, a]) => ({
      pieceId,
      publicaciones: a.n,
      likes: a.likes,
      comments: a.comments,
      saved: a.saved,
      puntajeMedio: Math.round(a.pts / a.n),
    }))
    .sort((x, y) => y.puntajeMedio - x.puntajeMedio);
}
