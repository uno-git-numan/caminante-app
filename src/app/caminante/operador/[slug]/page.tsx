// Perfil PÚBLICO del operador — diseño Claude Design (`.opf`) sobre datos reales
// de fetchOperatorProfile. Métricas derivadas en vivo, experiencias con su
// satisfacción real y testimonios aprobados (firmados con iniciales). La sección
// "equipo" del diseño se omite: no hay modelo de datos y no se inventa.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchOperatorProfile } from "@/lib/operators/public";
import { OPF_CSS } from "./opf-css";

// Isotipo compacto (glifo diagonal) para el avatar sin foto — igual al diseño.
const AV_MARK =
  '<svg viewBox="-14 -14 145 149" role="img" aria-label="Caminante"><g fill="#637154"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g></svg>';

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

export default async function OperadorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const op = await fetchOperatorProfile(slug);
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

      {/* HERO */}
      <header className="opf-hero">
        {op.photoUrl ? (
          <div className="ph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={op.photoUrl} alt="" />
          </div>
        ) : null}
        <div className="opf-wrap">
          <div className="in">
            <span className="opf-av">
              {op.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={op.photoUrl} alt={op.name} />
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
