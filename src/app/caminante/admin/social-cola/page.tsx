// Cola de publicaciones a redes: lo PROGRAMADO (con opción de cancelar) + el
// histórico reciente (publicado / fallido). Solo admin (gate del layout de admin).
// El cron `publish-social` publica lo programado cuando vence.
import { listRecentPosts, fetchPostsBetween, type SocialPost } from "@/lib/social/posts";
import { cancelarPostForm } from "@/lib/social/publish-actions";
import { HORA_PUBLICACION } from "@/lib/social/publish-hora";
import ColaCalendar from "./ColaCalendar";
import { fetchInsights, rendimientoPorPieza, type PiezaRendimiento } from "@/lib/social/insights";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cola de redes · Admin" };

const CSS = `
.scq{max-width:920px;margin:0 auto;padding:34px 22px 120px;font-family:"Geist",system-ui,sans-serif;color:#20211c;}
.scq .eyebrow{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#637154;}
.scq h1{font-size:34px;font-weight:200;letter-spacing:-.02em;margin:8px 0 6px;}
.scq .lead{color:rgba(32,33,28,.62);font-size:14px;line-height:1.5;max-width:64ch;}
.scq h2{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#637154;margin:34px 0 12px;}
.scq .row{border:1px solid rgba(32,33,28,.12);border-radius:14px;padding:14px 16px;margin-bottom:10px;background:#fff;display:flex;gap:14px;align-items:center;flex-wrap:wrap;}
.scq .thumb{width:44px;height:55px;border-radius:8px;object-fit:cover;flex:0 0 auto;background:#eee;}
.scq .meta{flex:1;min-width:220px;}
.scq .t1{font-size:15px;font-weight:500;}
.scq .t2{font-size:12.5px;color:rgba(32,33,28,.6);margin-top:2px;line-height:1.4;}
.scq .chip{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border-radius:999px;padding:5px 11px;white-space:nowrap;}
.scq .c-sched{background:rgba(201,183,156,.28);color:#8a6d3b;}
.scq .c-pub{background:rgba(99,113,84,.16);color:#4f5d44;}
.scq .c-fail{background:rgba(255,93,54,.12);color:#c23c1c;}
.scq .c-cancel{background:rgba(32,33,28,.08);color:#6b6b63;}
.scq .c-ing{background:rgba(60,120,200,.14);color:#3060a0;}
.scq .btn{border:1px solid rgba(32,33,28,.14);border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:600;background:#f1eee7;cursor:pointer;font-family:inherit;color:#20211c;}
.scq .btn:hover{background:#e6e2d9;}
.scq a{color:#c23c1c;}
.scq .rank{width:26px;height:26px;border-radius:999px;background:#20211c;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}
.scq .empty{color:rgba(32,33,28,.5);font-size:14px;padding:8px 0;}
.scq .back{display:inline-block;margin-top:18px;font-size:13px;color:#637154;text-decoration:none;}
.scq .vtoggle{display:inline-flex;gap:3px;background:#e9e6df;border-radius:999px;padding:3px;margin:10px 0 22px;}
.scq .vtoggle a{border-radius:999px;padding:7px 16px;font-size:13px;font-weight:600;text-decoration:none;color:#20211c;}
.scq .vtoggle a.on{background:#20211c;color:#fff;}
`;

// Mes siguiente ("YYYY-MM") para acotar el rango del calendario.
function nextMonth(mp: string): string {
  const [y, m] = mp.split("-").map(Number);
  const idx = y * 12 + (m - 1) + 1;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

const CHIP: Record<SocialPost["status"], string> = {
  scheduled: "c-sched",
  publishing: "c-ing",
  published: "c-pub",
  failed: "c-fail",
  canceled: "c-cancel",
};
const LABEL: Record<SocialPost["status"], string> = {
  scheduled: "Programada",
  publishing: "Publicando…",
  published: "Publicada",
  failed: "Falló",
  canceled: "Cancelada",
};

function fmt(iso: string | null, conHora = true): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit",
      month: "short",
      ...(conHora ? { hour: "2-digit" as const, minute: "2-digit" as const } : {}),
    });
  } catch {
    return iso;
  }
}

function Row({ post }: { post: SocialPost }) {
  // Programada: la hora guardada es la normalizada (≈02:00) que solo marca el
  // día; el robot publica ~1:00 p.m. → mostramos fecha + la hora REAL del cron.
  const fecha =
    post.status === "scheduled"
      ? `Programada para ${fmt(post.scheduledAt, false)} · ${HORA_PUBLICACION}`
      : post.status === "published"
        ? `Publicada ${fmt(post.publishedAt)}`
        : fmt(post.createdAt);
  return (
    <div className="row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {post.imageUrls[0] ? <img className="thumb" src={post.imageUrls[0]} alt="" /> : <span className="thumb" />}
      <div className="meta">
        <div className="t1">
          {post.pieceId ? `${post.pieceId} · ` : ""}
          {post.format === "story" ? "Story 9:16" : post.imageUrls.length > 1 ? `Carrusel (${post.imageUrls.length})` : "Post 4:5"}
          {post.experienceSlug ? ` · ${post.experienceSlug}` : ""}
        </div>
        <div className="t2">
          {fecha}
          {post.igPermalink ? <> · <a href={post.igPermalink} target="_blank" rel="noreferrer">ver en Instagram ↗</a></> : null}
          {post.error ? ` · ⚠️ ${post.error}` : ""}
        </div>
      </div>
      <span className={`chip ${CHIP[post.status]}`}>{LABEL[post.status]}</span>
      {post.status === "scheduled" ? (
        <form action={cancelarPostForm}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="btn">Cancelar</button>
        </form>
      ) : null}
    </div>
  );
}

export default async function SocialColaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; m?: string }>;
}) {
  const { view, m } = await searchParams;
  const esLista = view === "lista";
  const nowKey = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }); // YYYY-MM-DD (CDMX)
  const monthParam = /^\d{4}-\d{2}$/.test(m || "") ? (m as string) : nowKey.slice(0, 7);

  // Datos según la vista.
  let programadas: SocialPost[] = [];
  let historico: SocialPost[] = [];
  let mesPosts: SocialPost[] = [];
  if (esLista) {
    const posts = await listRecentPosts(80);
    programadas = posts.filter((p) => p.status === "scheduled" || p.status === "publishing");
    historico = posts.filter((p) => p.status !== "scheduled" && p.status !== "publishing");
  } else {
    mesPosts = await fetchPostsBetween(`${monthParam}-01T00:00:00-06:00`, `${nextMonth(monthParam)}-01T00:00:00-06:00`);
  }

  // Métricas: best-effort — si la tabla 0027 aún no existe, la página no se cae.
  let ranking: PiezaRendimiento[] = [];
  try {
    ranking = rendimientoPorPieza(await fetchInsights(90));
  } catch {
    ranking = [];
  }

  return (
    <div className="scq">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* Regla app-first: camino de vuelta visible arriba (no solo al fondo). */}
      <a className="back" style={{ marginTop: 0, marginBottom: 12 }} href="/caminante/admin">← Volver al panel</a>
      <div className="eyebrow">{"//"} Redes</div>
      <h1>Calendario de redes</h1>
      <p className="lead">
        Lo programado para Instagram y el histórico, por fecha. Las piezas se programan desde el{" "}
        <b>Kit de comunicación</b> de cada experiencia. El robot publica cada día lo que ya venció.
      </p>

      <div className="vtoggle">
        <a href={`?m=${monthParam}`} className={!esLista ? "on" : ""}>Calendario</a>
        <a href="?view=lista" className={esLista ? "on" : ""}>Lista</a>
      </div>

      {esLista ? (
        <>
          <h2>Programadas ({programadas.length})</h2>
          {programadas.length ? programadas.map((p) => <Row key={p.id} post={p} />) : <div className="empty">Nada programado por ahora.</div>}
          <h2>Histórico</h2>
          {historico.length ? historico.map((p) => <Row key={p.id} post={p} />) : <div className="empty">Aún no hay publicaciones.</div>}
        </>
      ) : (
        <ColaCalendar posts={mesPosts} monthParam={monthParam} />
      )}

      {/* QUÉ ESTÁ FUNCIONANDO (playbook §8: medir y replicar). Promedio por TIPO
          de pieza, no por post suelto: la pregunta útil es qué formato repetir. */}
      <h2>Qué está funcionando</h2>
      {ranking.length ? (
        <>
          <p className="lead" style={{ marginBottom: 12 }}>
            Promedio por tipo de pieza en los últimos 90 días. Los <b>comentarios</b> y los <b>saves</b> pesan
            triple: son las señales que mueven el algoritmo (los likes, casi nada).
          </p>
          {ranking.map((p, i) => (
            <div className="row" key={p.pieceId}>
              <div className="rank">{i + 1}</div>
              <div className="meta">
                <div className="t1">{p.pieceId}</div>
                <div className="t2">
                  {p.publicaciones} {p.publicaciones === 1 ? "publicación" : "publicaciones"} · {p.likes} likes ·{" "}
                  {p.comments} comentarios · {p.saved} saves
                </div>
              </div>
              <span className="chip c-pub">{p.puntajeMedio} pts</span>
            </div>
          ))}
        </>
      ) : (
        <div className="empty">
          Aún sin métricas. El robot las trae cada día de lo ya publicado; si acabas de publicar, dale unas horas.
        </div>
      )}

      <a className="back" href="/caminante/admin">← Volver al panel</a>
    </div>
  );
}
