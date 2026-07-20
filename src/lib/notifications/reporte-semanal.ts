// REPORTE SEMANAL al admin (lunes) — el loop de "medir y replicar" (playbook §8)
// llegando solo al correo: qué se publicó, cómo le fue, qué formato repetir y
// qué viene esta semana. Best-effort como el resto de notificaciones: si Resend
// falla, se registra y ya — jamás tira el cron.
import { fetchInsights, rendimientoPorPieza, puntaje, type PostInsight } from "@/lib/social/insights";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const FROM = "Caminante <caminante@numanhub.com>";
const ADMIN_EMAIL = "uno@numanhub.com";
const PANEL = "https://caminante.numanhub.com/caminante/admin/social-cola";

const num = (n: number | null): string => (n === null ? "—" : new Intl.NumberFormat("es-MX").format(n));
const fecha = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" }) : "—";

export type ResumenSemanal = {
  publicadas: PostInsight[];
  ranking: ReturnType<typeof rendimientoPorPieza>;
  proximas: { pieceId: string | null; slug: string | null; scheduledAt: string | null }[];
};

export async function armarResumenSemanal(): Promise<ResumenSemanal> {
  const todas = await fetchInsights(90);
  const hace7 = Date.now() - 7 * 86400000;
  const publicadas = todas.filter((i) => i.publishedAt && new Date(i.publishedAt).getTime() >= hace7);

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("social_posts")
    .select("piece_id, experience_slug, scheduled_at")
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .lte("scheduled_at", new Date(Date.now() + 7 * 86400000).toISOString())
    .order("scheduled_at");
  const proximas = ((data ?? []) as { piece_id: string | null; experience_slug: string | null; scheduled_at: string | null }[]).map(
    (r) => ({ pieceId: r.piece_id, slug: r.experience_slug, scheduledAt: r.scheduled_at }),
  );

  // El ranking mira 90 días: una semana sola no da señal suficiente para decidir
  // qué formato repetir.
  return { publicadas, ranking: rendimientoPorPieza(todas), proximas };
}

function html(r: ResumenSemanal): string {
  const fila = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px;color:#637154;font-size:13px;">${k}</td><td style="padding:6px 12px;font-size:14px;font-weight:600;color:#20211c;">${v}</td></tr>`;

  const publicadas = r.publicadas.length
    ? r.publicadas
        .map((i) =>
          fila(
            `${i.pieceId || "—"} · ${fecha(i.publishedAt)}`,
            `${num(i.likes)} likes · ${num(i.comments)} comentarios · ${num(i.saved)} saves`,
          ),
        )
        .join("")
    : fila("Esta semana", "No se publicó nada.");

  const top = r.ranking.slice(0, 3);
  const ranking = top.length
    ? top
        .map((p, n) =>
          fila(
            `${n + 1}. ${p.pieceId}`,
            `${p.puntajeMedio} pts de media · ${p.publicaciones} ${p.publicaciones === 1 ? "post" : "posts"} · ${p.saved} saves`,
          ),
        )
        .join("")
    : fila("Ranking", "Aún sin métricas suficientes.");

  const proximas = r.proximas.length
    ? r.proximas.map((p) => fila(fecha(p.scheduledAt), `${p.pieceId || "—"} · ${p.slug || "—"}`)).join("")
    : fila("Esta semana", "No hay nada programado.");

  const mejor = r.publicadas.slice().sort((a, b) => puntaje(b) - puntaje(a))[0];
  const destacado = mejor
    ? `<div style="padding:14px 20px;background:#faf8f3;border-top:1px solid rgba(32,33,28,.09);font-size:13.5px;line-height:1.5;color:#33352d;">
<b>Lo que más pegó:</b> ${mejor.pieceId || "un post"} del ${fecha(mejor.publishedAt)}${mejor.permalink ? ` — <a href="${mejor.permalink}" style="color:#637154;">verlo</a>` : ""}.
Repite ese formato antes que inventar uno nuevo.</div>`
    : "";

  const seccion = (t: string, filas: string) =>
    `<div style="padding:14px 20px 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#637154;font-weight:700;">${t}</div><table style="width:100%;border-collapse:collapse;">${filas}</table>`;

  return `<body style="margin:0;background:#fbfbf7;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid rgba(32,33,28,.13);border-radius:16px;overflow:hidden;">
<div style="background:#20392b;color:#fff;padding:16px 20px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;">Caminante · Reporte semanal de redes</div>
${seccion("Se publicó", publicadas)}
${seccion("Qué está funcionando (90 días)", ranking)}
${seccion("Esta semana sale", proximas)}
${destacado}
<div style="padding:14px 20px 20px;"><a href="${PANEL}" style="display:inline-block;background:#ff5d36;color:#fff;text-decoration:none;border-radius:999px;padding:10px 22px;font-size:14px;font-weight:600;">Ver la cola</a></div>
</div></body>`;
}

export async function enviarReporteSemanal(): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Falta RESEND_API_KEY." };
  try {
    const r = await armarResumenSemanal();
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "User-Agent": "caminante-notify/1.0", // Resend tras Cloudflare: sin UA → 403
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: `Redes · ${r.publicadas.length} ${r.publicadas.length === 1 ? "post" : "posts"} esta semana · ${r.proximas.length} en cola`,
        html: html(r),
      }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}
