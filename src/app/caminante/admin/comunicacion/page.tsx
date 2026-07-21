// Sección «Comunicación» del panel (nueva, 21 jul). Antes el Kit vivía DENTRO de
// cada experiencia y te mandaba a una página web separada; ahora la comunicación
// se opera desde aquí: un desplegable POR EVENTO (kit, material, cola de ese
// evento) + la cola de redes GLOBAL (calendario/lista) arriba. Vive dentro de
// AdminShell (nav de píldoras + expandibles [data-x]).
import AdminShell from "../ui/AdminShell";
import ColaCalendar from "../social-cola/ColaCalendar";
import { fetchEventos } from "@/lib/admin/queries";
import { listRecentPosts, fetchPostsBetween, type SocialPost } from "@/lib/social/posts";
import { HORA_PUBLICACION } from "@/lib/social/publish-hora";

export const dynamic = "force-dynamic";

// Si se llega con #ev-<slug> (botón «Comunicación →» del detalle de evento),
// abre ese desplegable y lo trae a la vista.
const HASH_OPEN = `
(function(){var h=location.hash;if(!h)return;try{var card=document.querySelector(h);}catch(e){return;}
if(!card)return;var head=card.querySelector('[data-x]');if(head){var b=document.getElementById(head.getAttribute('data-x'));if(b){b.classList.add('on');head.classList.add('open');}}
card.scrollIntoView({block:'start'});})();
`;

const CSS = `
.cmx .lead{color:var(--ink-soft);max-width:640px;margin:.4rem 0 0;font-size:14px;line-height:1.5;}
.cmx .vtoggle{display:inline-flex;gap:6px;margin:16px 0 10px;}
.cmx .vtoggle a{padding:6px 14px;border-radius:999px;border:1px solid var(--line);font-size:13px;font-weight:600;color:var(--ink-soft);text-decoration:none;}
.cmx .vtoggle a.on{background:var(--forest);color:#fff;border-color:var(--forest);}
.cmx .evrow{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.cmx .evrow .nm{font-weight:600;font-size:16px;}
.cmx .evrow .sub{color:var(--ink-soft);font-size:12.5px;margin-left:auto;display:flex;gap:10px;align-items:center;}
.cmx .acts{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 14px;}
.cmx .mini{border-top:1px solid var(--line);padding-top:10px;display:flex;flex-direction:column;gap:7px;}
.cmx .mini .m{display:flex;gap:10px;align-items:baseline;font-size:13px;flex-wrap:wrap;}
.cmx .mini .m .pid{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--ink-soft);min-width:30px;}
.cmx .mini .m .st{font-weight:600;}
.cmx .mini .m .st.sched{color:#7a5e2e;}
.cmx .mini .m .st.pub{color:#46543a;}
.cmx .mini .m .st.fail{color:#b0341a;}
.cmx .mini .m a{color:var(--forest);}
.cmx .muted{color:var(--ink-soft);font-size:13px;}
.cmx .draft{opacity:.66;}
`;

function fmtFecha(iso: string | null, conHora: boolean): string {
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

const RANK: Record<SocialPost["status"], number> = { publishing: 0, scheduled: 1, failed: 2, published: 3, canceled: 4 };

// Una línea de estado por post (misma verdad que la cola: una programada NO
// muestra la hora normalizada, muestra la hora REAL del cron).
function EstadoLinea({ p }: { p: SocialPost }) {
  if (p.status === "published") {
    return (
      <span className="m">
        <span className="pid">{p.pieceId || "—"}</span>
        <span className="st pub">Publicada</span>
        <span className="muted">{fmtFecha(p.publishedAt, true)}</span>
        {p.igPermalink ? (
          <a href={p.igPermalink} target="_blank" rel="noreferrer">ver en Instagram ↗</a>
        ) : null}
      </span>
    );
  }
  if (p.status === "failed") {
    return (
      <span className="m">
        <span className="pid">{p.pieceId || "—"}</span>
        <span className="st fail">Falló</span>
        {p.error ? <span className="muted">{p.error.slice(0, 80)}</span> : null}
      </span>
    );
  }
  if (p.status === "canceled") return <span className="m draft"><span className="pid">{p.pieceId || "—"}</span><span className="st muted">Cancelada</span></span>;
  // scheduled / publishing
  return (
    <span className="m">
      <span className="pid">{p.pieceId || "—"}</span>
      <span className="st sched">Programada</span>
      <span className="muted">{fmtFecha(p.scheduledAt, false)} · {HORA_PUBLICACION}</span>
    </span>
  );
}

export default async function ComunicacionPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; m?: string }>;
}) {
  const { view, m } = await searchParams;
  const esLista = view === "lista";

  // Mes en curso (CDMX) para el calendario.
  const cdmxMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const monthParam = m || cdmxMonth;
  const [yy, mm] = monthParam.split("-").map(Number);
  const inicioMes = new Date(Date.UTC(yy, mm - 1, 1)).toISOString();
  const inicioSig = new Date(Date.UTC(yy, mm, 1)).toISOString();

  const [eventos, recientes, mesPosts] = await Promise.all([
    fetchEventos(),
    listRecentPosts(300),
    esLista ? Promise.resolve<SocialPost[]>([]) : fetchPostsBetween(inicioMes, inicioSig),
  ]);

  // Agrupar posts por evento (para el desplegable de cada evento).
  const porEvento = new Map<string, SocialPost[]>();
  for (const p of recientes) {
    const k = p.experienceSlug || "";
    if (!k) continue;
    (porEvento.get(k) ?? porEvento.set(k, []).get(k)!).push(p);
  }

  const cuenta = (posts: SocialPost[], st: SocialPost["status"]) => posts.filter((p) => p.status === st).length;

  return (
    <AdminShell active="comunicacion">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cmx">
        <div className="sec-head">
          <div className="eyebrow">// Comunicación</div>
          <h1>Comunicación</h1>
          <p className="lead">
            Todo el contenido de cada evento en un solo lugar: abre su <strong>Kit</strong> (piezas + captions), su material y su cola.
            Arriba, la cola de redes global — lo programado y lo publicado, por fecha. El robot publica cada día lo que ya venció (~1:00 p.m.).
          </p>
        </div>

        {/* ── Cola de redes GLOBAL ── */}
        <div className="sec">
          <div className="vtoggle">
            <a href="/caminante/admin/comunicacion" className={!esLista ? "on" : ""}>Calendario</a>
            <a href="/caminante/admin/comunicacion?view=lista" className={esLista ? "on" : ""}>Lista</a>
          </div>
          {esLista ? (
            <div className="card">
              {recientes.length === 0 ? (
                <div className="muted">Aún no hay nada programado ni publicado. Programa piezas desde el Kit de un evento.</div>
              ) : (
                <div className="mini" style={{ borderTop: "none", paddingTop: 0 }}>
                  {[...recientes]
                    .sort((a, b) => RANK[a.status] - RANK[b.status] || (b.scheduledAt || b.createdAt).localeCompare(a.scheduledAt || a.createdAt))
                    .slice(0, 80)
                    .map((p) => (
                      <div key={p.id} className="m">
                        <EstadoLinea p={p} />
                        {p.experienceSlug ? <span className="muted">· {p.experienceSlug}</span> : null}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <ColaCalendar posts={mesPosts} monthParam={monthParam} />
          )}
        </div>

        {/* ── Por evento ── */}
        <div className="sec">
          <div className="sec-head"><h1 style={{ fontSize: 20 }}>Por evento</h1></div>
          {eventos.length === 0 ? (
            <div className="card muted">No hay eventos todavía. Crea uno desde «+ Experiencia».</div>
          ) : (
            eventos.map((ev) => {
              const posts = porEvento.get(ev.slug) ?? [];
              const prog = cuenta(posts, "scheduled") + cuenta(posts, "publishing");
              const pub = cuenta(posts, "published");
              const ordenados = [...posts].sort(
                (a, b) => RANK[a.status] - RANK[b.status] || (b.scheduledAt || b.createdAt).localeCompare(a.scheduledAt || a.createdAt),
              );
              return (
                <div key={ev.slug} className={`card${ev.status !== "published" ? " draft" : ""}`} id={`ev-${ev.slug}`} style={{ marginBottom: 10 }}>
                  <div className="evrow xhead" data-x={`evb-${ev.slug}`} style={{ cursor: "pointer" }}>
                    <span className="nm">{ev.nombre}</span>
                    {ev.status !== "published" ? <span className="chip">Borrador</span> : null}
                    <span className="sub">
                      <span>{prog} programada{prog === 1 ? "" : "s"}</span>
                      <span>·</span>
                      <span>{pub} publicada{pub === 1 ? "" : "s"}</span>
                      <span className="chev2" aria-hidden>▾</span>
                    </span>
                  </div>
                  <div className="xbody" id={`evb-${ev.slug}`}>
                    <div className="acts">
                      <a href={`/caminante/admin/kit/${ev.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-orange btn-sm">
                        Abrir Kit de comunicación →
                      </a>
                      <a href={`/caminante/admin/print/${ev.slug}?o=v`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">PDF vertical</a>
                      <a href={`/caminante/admin/print/${ev.slug}?o=h`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">PDF horizontal</a>
                      <a href={`/caminante/admin/social/${ev.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">Flyer redes</a>
                      <a href={`/caminante/admin/eventos/${ev.slug}`} className="btn btn-glass btn-sm">Ver evento</a>
                    </div>
                    {ordenados.length === 0 ? (
                      <div className="muted">Sin piezas en la cola. Programa una campaña desde el Kit.</div>
                    ) : (
                      <div className="mini">
                        {ordenados.slice(0, 20).map((p) => (
                          <EstadoLinea key={p.id} p={p} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <script dangerouslySetInnerHTML={{ __html: HASH_OPEN }} />
      </div>
    </AdminShell>
  );
}
