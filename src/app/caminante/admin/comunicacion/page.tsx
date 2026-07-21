// Sección «Comunicación» del panel (nueva, 21 jul). Antes el Kit vivía DENTRO de
// cada experiencia y te mandaba a una página web separada; ahora la comunicación
// se opera desde aquí: un desplegable POR EVENTO (kit, material, cola de ese
// evento) + la cola de redes GLOBAL (calendario/lista) arriba. Vive dentro de
// AdminShell y reusa el design system .adm (tablas, chips, cards, act-row).
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

// Extras mínimos — todo lo demás sale del design system .adm.
const CSS = `
.cmx .lead{color:var(--ink-soft);max-width:660px;font-size:13.5px;line-height:1.55;margin-top:6px;}
.cmx .vtoggle{display:inline-flex;gap:7px;margin-bottom:16px;}
.cmx .vtoggle a{padding:8px 16px;border-radius:999px;border:1px solid var(--line);font-size:13px;font-weight:500;color:var(--ink-soft);background:#fff;}
.cmx .vtoggle a:hover{color:var(--charcoal);}
.cmx .vtoggle a.on{background:var(--forest);color:#fff;border-color:var(--forest);}
.cmx .cev{overflow:hidden;margin-bottom:12px;}
.cmx .cevh{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:15px 20px;}
.cmx .cevh .nm{font-weight:600;font-size:15.5px;}
.cmx .cevh .metas{margin-left:auto;display:flex;align-items:center;gap:12px;font-size:12.5px;color:var(--ink-soft);}
.cmx .cevh.open{border-bottom:1px solid var(--line);}
.cmx .igl{color:var(--olive);font-weight:500;margin-left:8px;}
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

// La Lista global se agrupa por estado (programadas primero — lo accionable —,
// luego publicadas, falló y canceladas). Programadas ascendente (la más próxima
// arriba); el resto descendente (lo más reciente arriba).
const GRUPOS: { key: string; label: string; estados: SocialPost["status"][]; asc?: boolean }[] = [
  { key: "prog", label: "Programadas", estados: ["scheduled", "publishing"], asc: true },
  { key: "pub", label: "Publicadas", estados: ["published"] },
  { key: "fail", label: "Falló", estados: ["failed"] },
  { key: "canc", label: "Canceladas", estados: ["canceled"] },
];
const fechaOrden = (p: SocialPost) => p.publishedAt || p.scheduledAt || p.createdAt;

function chipDe(s: SocialPost["status"]): { cls: string; label: string } {
  switch (s) {
    case "published":
      return { cls: "c-pub", label: "Publicada" };
    case "scheduled":
    case "publishing":
      return { cls: "c-sol", label: "Programada" };
    case "failed":
      return { cls: "c-full", label: "Falló" };
    case "canceled":
      return { cls: "c-canc", label: "Cancelada" };
  }
}

// La hora mostrada de una programada es la REAL del cron (~1pm), no la
// normalizada; la publicada lleva su published_at real; la fallida, el error.
function cuando(p: SocialPost): string {
  if (p.status === "published") return fmtFecha(p.publishedAt, true);
  if (p.status === "scheduled" || p.status === "publishing") return `${fmtFecha(p.scheduledAt, false)} · ${HORA_PUBLICACION}`;
  if (p.status === "failed") return p.error ? p.error.slice(0, 90) : "";
  return "";
}

function ColaTabla({ posts, conEvento }: { posts: SocialPost[]; conEvento: boolean }) {
  return (
    <div className="card">
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Pieza</th>
              <th>Estado</th>
              <th>Cuándo</th>
              {conEvento ? <th>Evento</th> : null}
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => {
              const c = chipDe(p.status);
              return (
                <tr key={p.id}>
                  <td className="mono">{p.pieceId || "—"}</td>
                  <td>
                    <span className={`chip ${c.cls}`}>{c.label}</span>
                  </td>
                  <td className="mut">
                    {cuando(p)}
                    {p.igPermalink ? (
                      <a className="igl" href={p.igPermalink} target="_blank" rel="noreferrer">ver en Instagram ↗</a>
                    ) : null}
                  </td>
                  {conEvento ? <td className="mut">{p.experienceSlug}</td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ComunicacionPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; m?: string }>;
}) {
  const { view, m } = await searchParams;
  const esLista = view === "lista";

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

  const porEvento = new Map<string, SocialPost[]>();
  for (const p of recientes) {
    const k = p.experienceSlug || "";
    if (!k) continue;
    (porEvento.get(k) ?? porEvento.set(k, []).get(k)!).push(p);
  }
  const ordenar = (posts: SocialPost[]) =>
    [...posts].sort((a, b) => RANK[a.status] - RANK[b.status] || (b.scheduledAt || b.createdAt).localeCompare(a.scheduledAt || a.createdAt));
  const cuenta = (posts: SocialPost[], st: SocialPost["status"]) => posts.filter((p) => p.status === st).length;

  return (
    <AdminShell active="comunicacion">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cmx">
        <div className="sec-head">
          <div>
            <div className="eyebrow"><span className="sl">//</span> Comunicación</div>
            <h1>Comunicación</h1>
          </div>
        </div>
        <p className="lead">
          El contenido de cada evento en un solo lugar: abre su <strong>Kit</strong> (piezas + captions), su material y su cola.
          Arriba, la cola de redes global. El robot publica cada día lo que ya venció (~1:00 p.m.).
        </p>

        {/* ── Cola de redes GLOBAL ── */}
        <div className="sec" style={{ marginTop: 26 }}>
          <div className="vtoggle">
            <a href="/caminante/admin/comunicacion" className={!esLista ? "on" : ""}>Calendario</a>
            <a href="/caminante/admin/comunicacion?view=lista" className={esLista ? "on" : ""}>Lista</a>
          </div>
          {esLista ? (
            recientes.length === 0 ? (
              <div className="empty">Aún no hay nada programado ni publicado. Programa piezas desde el Kit de un evento.</div>
            ) : (
              GRUPOS.map((g) => {
                const posts = recientes
                  .filter((p) => g.estados.includes(p.status))
                  .sort((a, b) => (g.asc ? fechaOrden(a).localeCompare(fechaOrden(b)) : fechaOrden(b).localeCompare(fechaOrden(a))));
                if (!posts.length) return null;
                return (
                  <div key={g.key} style={{ marginBottom: 24 }}>
                    <span className="subtitle">{g.label} · {posts.length}</span>
                    <ColaTabla posts={posts.slice(0, 80)} conEvento />
                  </div>
                );
              })
            )
          ) : (
            <ColaCalendar posts={mesPosts} monthParam={monthParam} />
          )}
        </div>

        {/* ── Por evento ── */}
        <div className="sec">
          <div className="sec-head">
            <h2>Por evento</h2>
          </div>
          {eventos.length === 0 ? (
            <div className="empty">No hay eventos todavía. Crea uno desde «+ Experiencia».</div>
          ) : (
            eventos.map((ev) => {
              const posts = porEvento.get(ev.slug) ?? [];
              const prog = cuenta(posts, "scheduled") + cuenta(posts, "publishing");
              const pub = cuenta(posts, "published");
              const ordenados = ordenar(posts).filter((p) => p.status !== "canceled");
              return (
                <div key={ev.slug} className="card cev" id={`ev-${ev.slug}`}>
                  <div className="cevh xhead" data-x={`evb-${ev.slug}`}>
                    <span className="nm">{ev.nombre}</span>
                    {ev.status !== "published" ? <span className="chip c-draft">Borrador</span> : null}
                    <span className="metas">
                      <span>{prog} programada{prog === 1 ? "" : "s"} · {pub} publicada{pub === 1 ? "" : "s"}</span>
                      <span className="chev2" aria-hidden>▾</span>
                    </span>
                  </div>
                  <div className="xbody" id={`evb-${ev.slug}`}>
                    <div className="xpad" style={{ padding: "16px 20px 18px" }}>
                      <div className="act-row" style={{ marginTop: 0, marginBottom: 16 }}>
                        <a href={`/caminante/admin/kit/${ev.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-orange btn-sm">
                          Abrir Kit de comunicación →
                        </a>
                        <a href={`/caminante/admin/print/${ev.slug}?o=v`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">PDF vertical</a>
                        <a href={`/caminante/admin/print/${ev.slug}?o=h`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">PDF horizontal</a>
                        <a href={`/caminante/admin/social/${ev.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">Flyer redes</a>
                        <a href={`/caminante/admin/eventos/${ev.slug}`} className="btn btn-ghost btn-sm">Ver evento</a>
                      </div>
                      {ordenados.length === 0 ? (
                        <div className="empty">Sin piezas en la cola. Programa una campaña desde el Kit.</div>
                      ) : (
                        <ColaTabla posts={ordenados.slice(0, 20)} conEvento={false} />
                      )}
                    </div>
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
