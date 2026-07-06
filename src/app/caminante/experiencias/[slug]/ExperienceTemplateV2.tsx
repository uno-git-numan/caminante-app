// Plantilla data-driven del diseño bespoke Caminante (ensenada/hongos).
// Renderiza `experience.page.blocks` 1:1 contra el CSS extraído del HTML
// original (template-v2-css.ts) — misma apariencia, ahora desde la BD.
// Server component: la interactividad (logo SVG, nav al hacer scroll, drawer)
// la da el script compartido inyectado al final (template-v2-script.ts).
// Las fechas se pintan desde `slots` (disponibilidad en vivo), no del contenido.
import type { CSSProperties, ReactNode } from "react";
import type {
  Experience,
  PageBlock,
  V2Action,
  V2Hero,
  V2Split,
  V2Statement,
  V2Itinerary,
  V2Tariff,
  V2Checklist,
  V2Faq,
  V2Packing,
  V2Dates,
  V2Closing,
  V2Image,
} from "@/lib/experiences/types";
import type { SlotAvailabilityPublic } from "@/lib/experiences/availability";
import { TEMPLATE_V2_CSS } from "@/lib/experiences/template-v2-css";
import { TEMPLATE_V2_SCRIPT } from "@/lib/experiences/template-v2-script";

// --- markup inline sencillo: **negrita** y *itálica* ---
function renderInline(text: string): ReactNode {
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<b key={k++}>{m[1]}</b>);
    else out.push(<em key={k++}>{m[2]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}

function imgStyle(im: V2Image): CSSProperties | undefined {
  return im.pos ? { objectPosition: im.pos } : undefined;
}

function Eyebrow({ pre, text, white }: { pre?: string; text: string; white?: boolean }) {
  return (
    <span className="eyebrow" style={white ? { color: "#fff" } : undefined}>
      {pre ? <>{pre} </> : null}
      <span className="sl">{"//"}</span>
      {pre ? <> {text}</> : <> {text}</>}
    </span>
  );
}

function Title({ t, accent }: { t: string; accent?: string }) {
  return (
    <h2 className="display">
      {t}
      {accent ? (
        <>
          {" "}
          <em className="ac">{accent}</em>
        </>
      ) : null}
    </h2>
  );
}

function Btn({ a }: { a: V2Action }) {
  return (
    <a href={a.href} className={`btn btn-${a.variant}${a.arrow ? " btn-arrow" : ""}`}>
      {a.label}
    </a>
  );
}

function Media({ media }: { media: V2Split["media"] }) {
  if (media.kind === "photo") {
    const im = media.images[0];
    return (
      <div className="photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={im.url} alt={im.alt || ""} style={imgStyle(im)} />
      </div>
    );
  }
  return (
    <div
      className="mosaic"
      style={media.rows ? { gridTemplateRows: media.rows } : undefined}
    >
      {media.images.map((im, i) => (
        <div key={i} className={`m${im.big ? " big" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={im.url} alt={im.alt || ""} style={imgStyle(im)} />
        </div>
      ))}
    </div>
  );
}

function Allies({ items }: { items: { name: string; role?: string }[] }) {
  return (
    <div style={{ marginTop: 24 }}>
      {items.map((it, i) => (
        <div className="ally" key={i}>
          <span className="dot" />
          <div>
            <span className="nm">{it.name}</span>
            {it.role ? (
              <>
                {"  "}
                <span className="ro">{it.role}</span>
              </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- bloques ---
function HeroBlock({ b }: { b: V2Hero }) {
  const actions =
    b.actions ??
    [
      { label: "Ver próximas fechas", href: "#fechas", variant: "glass", arrow: true },
      { label: "La experiencia", href: "#experiencia", variant: "outline-d" },
    ] as V2Action[];
  return (
    <header className="hero" id="top">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={imgStyle(b.bg)} />
      <div className="veil" />
      <div className="container">
        <div className="hero-top">
          <span className="eyebrow">
            <span className="sl">{"//"}</span> {b.eyebrow}
          </span>
          {b.metaEst ? <span className="meta-est">{b.metaEst}</span> : null}
        </div>
        <h1 className="display">
          {b.title}
          {b.titleAccent ? (
            <>
              {" "}
              <em className="ac">{b.titleAccent}</em>
            </>
          ) : null}
        </h1>
        {b.sub ? <p className="sub lead">{b.sub}</p> : null}
        <div className="actions">
          {actions.map((a, i) => (
            <Btn key={i} a={a} />
          ))}
        </div>
      </div>
    </header>
  );
}

function SplitBlock({ b, secnum }: { b: V2Split; secnum: string }) {
  const bgVar = b.bg === "panel" ? "var(--panel)" : "var(--cream)";
  const frameClass = b.frame === "xp" ? "xp" : "allies-sec";
  const text = (
    <div>
      <div className="shead-num">
        <div className="shead-main">
          <Eyebrow text={b.eyebrow} />
          <Title t={b.title} accent={b.titleAccent} />
        </div>
        <span className="secnum">{secnum}</span>
      </div>
      {b.subEyebrow ? (
        <div className="eyebrow" style={{ color: "var(--orange)", margin: "14px 0 22px" }}>
          {b.subEyebrow}
        </div>
      ) : null}
      {b.points ? (
        <div className="points" style={{ marginTop: 28 }}>
          {b.points.map((p, i) => (
            <div className="pt" key={i}>
              {p}
            </div>
          ))}
        </div>
      ) : null}
      {b.items ? <Allies items={b.items} /> : null}
      {b.paragraphs
        ? b.paragraphs.map((p, i) => (
            <p
              className="lead"
              key={i}
              style={{
                fontSize: "clamp(17px,2.1vw,20px)",
                color: "#36382f",
                ...(i > 0 ? { marginTop: 16 } : null),
              }}
            >
              {renderInline(p)}
            </p>
          ))
        : null}
      {b.lead ? (
        <p
          className="lead"
          style={{ fontSize: 17, color: "var(--ink-soft)", marginTop: 24, maxWidth: "46ch" }}
        >
          {renderInline(b.lead)}
        </p>
      ) : null}
    </div>
  );
  const media = <Media media={b.media} />;
  return (
    <section
      className={`section ${frameClass}`}
      id={b.anchor}
      style={{ background: bgVar }}
    >
      <div className="container grid">
        {b.media.side === "left" ? (
          <>
            {media}
            {text}
          </>
        ) : (
          <>
            {text}
            {media}
          </>
        )}
      </div>
    </section>
  );
}

function StatementBlock({ b }: { b: V2Statement }) {
  return (
    <section className="medi">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={imgStyle(b.bg)} />
      <div className="veil" />
      <div className="container">
        <Eyebrow pre={b.eyebrowPre} text={b.eyebrow} white />
        <h2 className="display">
          {b.title}
          {b.titleAccent ? (
            <>
              {" "}
              <em className="ac">{b.titleAccent}</em>
            </>
          ) : null}
        </h2>
        {b.body ? <p className="lead">{b.body}</p> : null}
        {b.quote ? <div className="quote">{b.quote}</div> : null}
      </div>
    </section>
  );
}

function ItineraryBlock({ b, secnum }: { b: V2Itinerary; secnum: string }) {
  return (
    <section className="section itin">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={imgStyle(b.bg)} />
      <div className="veil" />
      <div className="container">
        <div className="shead-num">
          <div className="shead-main">
            <Eyebrow text={b.eyebrow} />
            <Title t={b.title} accent={b.titleAccent} />
          </div>
          <span className="secnum">{secnum}</span>
        </div>
        <div className="days">
          {b.days.map((d, i) => (
            <div className="day glass" key={i}>
              {d.num ? <div className="dnum">{d.num}</div> : null}
              <div className="dlab">{d.lab}</div>
              {d.ttl ? (
                <div
                  className="dttl"
                  style={{ fontSize: 18, fontWeight: 500, color: "#fff", margin: "8px 0 4px" }}
                >
                  {d.ttl}
                </div>
              ) : null}
              <ul>
                {d.items.map((li, j) => (
                  <li key={j}>{renderInline(li)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TariffBlock({ b, secnum }: { b: V2Tariff; secnum: string }) {
  return (
    <section className="section invest">
      <div className="container grid">
        <div>
          <div className="shead-num">
            <div className="shead-main">
              <Eyebrow text={b.eyebrow} />
              <Title t={b.title} accent={b.titleAccent} />
            </div>
            <span className="secnum">{secnum}</span>
          </div>
          {b.lead ? (
            <p className="lead" style={{ marginTop: 22 }}>
              {b.lead}
            </p>
          ) : null}
        </div>
        <div className="tariff">
          <div className="tier">{b.tier}</div>
          <div className="price">
            {b.price} {b.priceCur ? <span className="cur">{b.priceCur}</span> : null}
          </div>
          {b.availK || b.availV ? (
            <div className="avail">
              <span className="k">{b.availK}</span>
              <span className="v">{b.availV}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ChecklistBlock({ b, secnum }: { b: V2Checklist; secnum: string }) {
  return (
    <section className="section incl">
      <div className="container">
        <div className="shead-num">
          <div className="shead-main">
            <Eyebrow text={b.eyebrow} />
            <Title t={b.title} accent={b.titleAccent} />
          </div>
          <span className="secnum">{secnum}</span>
        </div>
        <div className="grid">
          <div>
            <div className="col-h yes-h">{b.yesTitle}</div>
            {b.yesItems.map((it, i) => (
              <div className="inc-item yes" key={i}>
                <span className="mk">{b.yesMark || "+"}</span>
                {it}
              </div>
            ))}
          </div>
          <div>
            <div className="col-h no-h">{b.noTitle}</div>
            {b.noItems.map((it, i) => (
              <div className="inc-item no" key={i}>
                <span className="mk">{b.noMark || "−"}</span>
                {it}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqBlock({ b }: { b: V2Faq }) {
  return (
    <section className="section faq">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={imgStyle(b.bg)} />
      <div className="veil" />
      <div className="container">
        <div className="glasscard">
          <Eyebrow text={b.eyebrow} />
          {b.qa.map((x, i) => (
            <div className="qa" key={i}>
              <div className="q">{x.q}</div>
              <div className="a">{x.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PackingBlock({ b, secnum }: { b: V2Packing; secnum: string }) {
  return (
    <section className="section pack-sec">
      <div className="container grid">
        <div>
          <div className="shead-num">
            <div className="shead-main">
              <Eyebrow text={b.eyebrow} />
              <Title t={b.title} accent={b.titleAccent} />
            </div>
            <span className="secnum">{secnum}</span>
          </div>
          {b.cap ? (
            <p className="cap" style={{ marginTop: 16 }}>
              {b.cap}
            </p>
          ) : null}
          <div className="pack">
            {b.items.map((it, i) => (
              <div className="pk" key={i}>
                <span className="box" />
                {it}
              </div>
            ))}
          </div>
        </div>
        <div className="photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.photo.url} alt={b.photo.alt || ""} style={imgStyle(b.photo)} />
        </div>
      </div>
    </section>
  );
}

function cupoText(s: SlotAvailabilityPublic): ReactNode {
  if (s.soldOut) return "Agotado";
  if (s.available === null) return "Lugares disponibles";
  if (s.available === 1) return "Queda 1 lugar";
  return `Quedan ${s.available} lugares`;
}

function DatesBlock({
  b,
  secnum,
  slug,
  slots,
}: {
  b: V2Dates;
  secnum: string;
  slug: string;
  slots: SlotAvailabilityPublic[];
}) {
  return (
    <section className="section fechas" id="fechas">
      <div className="container">
        <div className="shead-num">
          <div className="shead-main">
            <Eyebrow text={b.eyebrow} />
            <Title t={b.title} accent={b.titleAccent} />
            {b.cap ? <p className="cap">{b.cap}</p> : null}
          </div>
          <span className="secnum">{secnum}</span>
        </div>

        <div className="date-grid">
          {slots.map((s, i) => (
            <div className="date-card" data-salida={i + 1} key={s.id}>
              <div className="salida">Salida {i + 1}</div>
              <div className="fecha">{s.label}</div>
              <div className="meta-row">
                <span className="k">Disponibilidad</span>
                <span className="cupo">{cupoText(s)}</span>
              </div>
            </div>
          ))}
        </div>

        {b.priceLine ? <p className="price-line">{renderInline(b.priceLine)}</p> : null}
        <div className="actions">
          <a href={`/caminante/reservar/${slug}`} className="btn btn-orange btn-arrow">
            Reservar y pagar
          </a>
          <a href={`/caminante/registro/${slug}`} className="btn btn-outline-d">
            Registrarme
          </a>
        </div>
      </div>
    </section>
  );
}

function ClosingBlock({ b, slug }: { b: V2Closing; slug: string }) {
  const actions =
    b.actions ??
    ([
      { label: "Ver próximas fechas", href: "#fechas", variant: "glass" },
      {
        label: "Reservar y pagar",
        href: `/caminante/reservar/${slug}`,
        variant: "orange",
        arrow: true,
      },
    ] as V2Action[]);
  return (
    <section className="section close">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={imgStyle(b.bg)} />
      <div className="veil" />
      <div className="container">
        <div className="glasscard-c">
          <Eyebrow text={b.eyebrow} />
          <h2 className="display">
            {b.title}
            {b.titleAccent ? (
              <>
                {" "}
                <em className="ac">{b.titleAccent}</em>
              </>
            ) : null}
          </h2>
          <div className="contact">
            {b.contacts.map((c, i) => (
              <div className="crow" key={i}>
                <span className="lbl">{c.lbl}</span>
                <span className="val">{c.val}</span>
              </div>
            ))}
          </div>
          <div className="actions">
            {actions.map((a, i) => (
              <Btn key={i} a={a} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Tipos de bloque que muestran número de sección (secnum "01"..).
const NUMBERED = new Set(["split", "itinerary", "tariff", "checklist", "packing", "dates"]);

export default function ExperienceTemplateV2({
  experience,
  slots,
}: {
  experience: Experience;
  slots: SlotAvailabilityPublic[];
}) {
  const slug = experience.slug;
  const blocks = experience.page?.blocks ?? [];
  let n = 0;
  const secnumFor = (t: PageBlock["type"]) =>
    NUMBERED.has(t) ? String(++n).padStart(2, "0") : "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TEMPLATE_V2_CSS }} />

      {/* NAV */}
      <nav className="nav" id="nav">
        <a href="/caminante" className="brand" aria-label="Caminante — inicio">
          <span className="logo-word" data-word />
          <span className="logo-mark" data-mark />
        </a>
        <div className="nav-links">
          <a href="/caminante">Inicio</a>
          <a href="/caminante#proximos">Calendario</a>
          <a href="/caminante#aprende">Aprende</a>
          <a href="/caminante#quees">Nosotros</a>
        </div>
        <div className="nav-cta">
          <a href="#fechas" className="btn btn-orange">
            Reservar
          </a>
          <button className="burger" id="burger" aria-label="Abrir menú" aria-expanded="false">
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className="drawer" id="drawer">
        <a href="/caminante">
          <span className="sl">{"//"}</span>Inicio
        </a>
        <a href="/caminante#proximos">
          <span className="sl">{"//"}</span>Calendario
        </a>
        <a href="/caminante#aprende">
          <span className="sl">{"//"}</span>Aprende
        </a>
        <a href="/caminante#quees">
          <span className="sl">{"//"}</span>Nosotros
        </a>
        <a href="#fechas" className="btn btn-orange">
          Reservar
        </a>
      </div>

      {blocks.map((b, i) => {
        const secnum = secnumFor(b.type);
        switch (b.type) {
          case "hero":
            return <HeroBlock key={i} b={b} />;
          case "split":
            return <SplitBlock key={i} b={b} secnum={secnum} />;
          case "statement":
            return <StatementBlock key={i} b={b} />;
          case "itinerary":
            return <ItineraryBlock key={i} b={b} secnum={secnum} />;
          case "tariff":
            return <TariffBlock key={i} b={b} secnum={secnum} />;
          case "checklist":
            return <ChecklistBlock key={i} b={b} secnum={secnum} />;
          case "faq":
            return <FaqBlock key={i} b={b} />;
          case "packing":
            return <PackingBlock key={i} b={b} secnum={secnum} />;
          case "dates":
            return <DatesBlock key={i} b={b} secnum={secnum} slug={slug} slots={slots} />;
          case "closing":
            return <ClosingBlock key={i} b={b} slug={slug} />;
          default:
            return null;
        }
      })}

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="word" data-word aria-label="Caminante" />
          <div className="tagline">Caminante · Naturaleza en movimiento</div>
          <div className="sub">Una expansión de NUMAN al mundo natural</div>
          <p className="desc">
            Caminante lleva la educación encarnada de NUMAN a paisajes reales. Una parte de cada
            experiencia se destina a la conservación del lugar que la hace posible.
          </p>
          <div className="fbottom">
            <span>© 2026 Caminante</span>
            <span>uno@numanhub.com · @somos.caminante</span>
          </div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: TEMPLATE_V2_SCRIPT }} />
    </>
  );
}
