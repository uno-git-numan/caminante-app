// Perfil PÚBLICO del operador — diseño Claude Design (`.opf`) sobre datos reales
// de fetchOperatorProfile. Métricas derivadas en vivo, experiencias con su
// satisfacción real y testimonios aprobados (firmados con iniciales). La sección
// "equipo" del diseño se omite: no hay modelo de datos y no se inventa.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchOperatorProfile } from "@/lib/operators/public";
import { adjustStyle } from "@/lib/operators/photo-style";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { OPF_CSS } from "./opf-css";

// Sello COMPLETO de Caminante en sus colores verdaderos (olive/sand/orange) —
// regla de marca: el sello jamás se tiñe.
const AV_MARK =
  '<svg viewBox="-20 -20 477.31 161.74" role="img" aria-label="Caminante"><g fill="#637154"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g><g fill="#b6ada5"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g><g fill="#ff5d36"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g></svg>';

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const op = await fetchOperatorProfile(slug);
  return { title: op ? `${op.name} · Operador · Caminante` : "Operador · Caminante" };
}

const fmtDesde = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

// "Numan · Caminante" → título con la última parte en acento naranja.
function tituloConAcento(name: string) {
  const parts = name.split(" · ");
  if (parts.length < 2) return <>{name}</>;
  const head = parts.slice(0, -1).join(" · ");
  return (
    <>
      {head} · <em className="opf-ac">{parts[parts.length - 1]}</em>
    </>
  );
}

export default async function OperadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { slug } = await params;
  // ?draft=1 (solo admin): vista previa aunque el perfil no sea público aún.
  const esDraft = (await searchParams).draft === "1" && (await isCurrentUserAdmin());
  const op = await fetchOperatorProfile(slug, { includeDraft: esDraft });
  if (!op) notFound();
  const m = op.metrics;

  // Stats: solo las que tienen dato real.
  const stats: { n: React.ReactNode; l: string }[] = [];
  if (m.salidas > 0) stats.push({ n: m.salidas, l: m.salidas === 1 ? "Salida operada" : "Salidas operadas" });
  if (m.viajeros > 0) stats.push({ n: m.viajeros, l: "Viajeros" });
  if (m.stars != null)
    stats.push({
      n: (
        <>
          <span className="st">★</span> {m.stars.toFixed(1)} <small>({m.encuestas})</small>
        </>
      ),
      l: "Satisfacción",
    });
  if (m.volveria != null) stats.push({ n: `${m.volveria}%`, l: "Volvería a viajar" });

  const ig = op.instagram ? op.instagram.replace(/^@/, "") : null;

  return (
    <div className="opf">
      <style dangerouslySetInnerHTML={{ __html: OPF_CSS }} />
      {esDraft && !op.isPublic ? (
        <div style={{ background: "#ff5d36", color: "#fff", textAlign: "center", padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>
          Vista previa — este perfil aún NO es público. Publícalo desde el panel.
        </div>
      ) : null}

      {/* HERO */}
      <header className="opf-hero">
        {op.heroPhotoUrl ? (
          <div className="ph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={op.heroPhotoUrl} alt="" style={adjustStyle(op.heroAdjust)} />
          </div>
        ) : null}
        <div className="opf-wrap">
          <div className="in">
            <span className="opf-av">
              {op.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={op.photoUrl} alt={op.name} style={adjustStyle(op.photoAdjust)} />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: AV_MARK }} />
              )}
            </span>
            <span className="opf-eyebrow">
              <span className="sl">//</span> Operador
            </span>
            <h1 className="opf-display">{tituloConAcento(op.name)}</h1>
            <div className="opf-meta">
              <span>Opera desde {fmtDesde(op.since)}</span>
              {ig ? (
                <>
                  <span className="dot" />
                  <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer">
                    @{ig}
                  </a>
                </>
              ) : null}
            </div>
            {op.bio ? <p className="opf-bio">{op.bio}</p> : null}

            {stats.length ? (
              <div className="opf-stats">
                {stats.map((s, i) => (
                  <div className="opf-stat" key={i}>
                    <div className="n">{s.n}</div>
                    <div className="l">{s.l}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* EXPERIENCIAS */}
      {op.experiencias.length ? (
        <section className="opf-sec">
          <div className="opf-wrap">
            <div className="hd">
              <span className="opf-eyebrow">
                <span className="sl">//</span> Sus experiencias
              </span>
              <h2 className="opf-display">
                Los caminos que <em className="opf-ac">abre.</em>
              </h2>
            </div>
            <div className="opf-grid">
              {op.experiencias.map((e) => (
                <a className="opf-exp" href={`/caminante/experiencias/${e.slug}`} key={e.slug}>
                  <div className="im">
                    {e.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.image} alt={e.imageAlt || e.title} />
                    ) : null}
                  </div>
                  <div className="bd">
                    {e.ploc ? (
                      <span className="pl">
                        <span className="sl">//</span> {e.ploc}
                      </span>
                    ) : null}
                    <h3>{e.title}</h3>
                    {e.rating && e.rating.stars ? (
                      <span className="rt">
                        <span className="st">★</span> {e.rating.stars.toFixed(1)}{" "}
                        <small>({e.rating.count} {e.rating.count === 1 ? "reseña" : "reseñas"})</small>
                      </span>
                    ) : (
                      <span className="rt nueva">Experiencia nueva</span>
                    )}
                    {e.hook ? <p className="hk">{e.hook}</p> : null}
                    <span className="go">Ver experiencia →</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* EQUIPO */}
      {op.team.length ? (
        <section className="opf-sec">
          <div className="opf-wrap">
            <div className="hd">
              <span className="opf-eyebrow">
                <span className="sl">//</span> Su equipo
              </span>
              <h2 className="opf-display">
                Quienes caminan <em className="opf-ac">contigo.</em>
              </h2>
            </div>
            <div className="opf-team">
              {op.team.map((t, i) => (
                <div className="opf-member" key={i}>
                  {t.photoUrl ? (
                    <span className="im">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.photoUrl} alt={t.name} style={adjustStyle(t.adjust)} />
                    </span>
                  ) : null}
                  <span className="nm">{t.name}</span>
                  {t.role ? <span className="bio">{t.role}</span> : null}
                  {t.quote ? <span className="qt">“{t.quote}”</span> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* TESTIMONIOS */}
      {op.testimonios.length ? (
        <section className="opf-sec">
          <div className="opf-wrap">
            <div className="hd">
              <span className="opf-eyebrow">
                <span className="sl">//</span> Lo que dicen sus viajeros
              </span>
              <h2 className="opf-display">
                Palabras del <em className="opf-ac">camino.</em>
              </h2>
            </div>
            <div className="opf-quotes">
              {op.testimonios.map((t, i) => (
                <figure className="opf-quote" key={i}>
                  {t.stars != null ? (
                    <div className="opf-stars">
                      {"★".repeat(Math.round(t.stars))}
                      {"☆".repeat(Math.max(0, 5 - Math.round(t.stars)))}
                    </div>
                  ) : null}
                  <blockquote>{t.text}</blockquote>
                  <figcaption>
                    {t.initials}
                    {t.location ? ` · ${t.location}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CIERRE */}
      <footer className="opf-foot">
        <a className="opf-back" href="/caminante">
          ← Volver a Caminante
        </a>
      </footer>
    </div>
  );
}
