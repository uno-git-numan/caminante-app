// Plantilla data-driven del diseño bespoke Caminante (ensenada/hongos).
// Renderiza `experience.page.blocks` 1:1 contra el CSS extraído del HTML
// original (template-v2-css.ts) — misma apariencia, ahora desde la BD.
// Server component: la interactividad (logo SVG, nav al hacer scroll, drawer)
// la da el script compartido inyectado al final (template-v2-script.ts).
// Las fechas se pintan desde `slots` (disponibilidad en vivo), no del contenido.
import { Fragment } from "react";
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
import type { OperatorChip } from "@/lib/operators/public";
import { TEMPLATE_V2_CSS } from "@/lib/experiences/template-v2-css";
import { TEMPLATE_V2_SCRIPT } from "@/lib/experiences/template-v2-script";
import { PixelEvent } from "@/lib/meta/pixel";

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
// Chip "Operada por" (glass, clickeable → perfil público del operador). La ★
// solo aparece cuando ya hay encuestas respondidas.
function OperadorChip({ op }: { op: OperatorChip }) {
  return (
    <a className="op-chip" href={`/caminante/operador/${op.slug}`}>
      {op.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="op-avatar" src={op.photoUrl} alt="" />
      ) : (
        <span className="op-avatar op-avatar-mark" aria-hidden="true" />
      )}
      <span className="op-lbl">Operada por</span>
      <span className="op-nm">{op.name}</span>
      {op.stars != null ? <span className="op-star">★ {op.stars}</span> : null}
      <span className="op-arrow">→</span>
    </a>
  );
}

function HeroBlock({
  b,
  collaborators,
  operatorChip,
}: {
  b: V2Hero;
  collaborators?: { name: string; logoUrl: string }[];
  operatorChip?: OperatorChip | null;
}) {
  const logos = (collaborators ?? []).filter((c) => c.logoUrl?.trim());
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
        {operatorChip ? <OperadorChip op={operatorChip} /> : null}
        {logos.length ? (
          <div className="collab-strip">
            <span className="lbl">En colaboración con</span>
            <div className="collab-strip-logos">
              {logos.map((c, i) => (
                <span className="collab-chip" key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logoUrl} alt={c.name || ""} />
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

// Banda de logos de colaboradores (fondo claro), para la zona de guías/aliados.
function CollaboratorsBand({ logos }: { logos: { name: string; logoUrl: string }[] }) {
  return (
    <section className="section collab-band">
      <div className="container">
        <div className="collab-band-lbl">
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Colaboradores y aliados
          </span>
        </div>
        <div className="collab-band-logos">
          {logos.map((c, i) => (
            <div className="collab-band-logo" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logoUrl} alt={c.name || ""} />
              {c.name ? <span>{c.name}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
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

function money(a: string): string {
  const digits = a.replace(/[^\d]/g, "");
  if (!digits) return a;
  return "$" + Number(digits).toLocaleString("es-MX");
}

function TariffBlock({
  b,
  secnum,
  tiers,
}: {
  b: V2Tariff;
  secnum: string;
  tiers?: { label: string; amount: string }[];
}) {
  const levels = (tiers ?? []).filter((t) => t.label?.trim() && t.amount?.trim());
  const lowest =
    levels.length > 0
      ? levels
          .map((t) => Number(t.amount.replace(/[^\d]/g, "")))
          .filter((n) => n > 0)
          .sort((x, y) => x - y)[0]
      : null;
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
          {levels.length > 0 ? (
            <>
              <div className="price">
                Desde {lowest ? money(String(lowest)) : b.price}{" "}
                {b.priceCur ? <span className="cur">{b.priceCur}</span> : null}
              </div>
              <div style={{ marginTop: 18 }}>
                {levels.map((t, i) => (
                  <div
                    key={i}
                    className="avail"
                    style={{ marginTop: i === 0 ? 0 : 0, paddingTop: 14 }}
                  >
                    <span className="k">{t.label}</span>
                    <span className="v">{money(t.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="price">
              {b.price} {b.priceCur ? <span className="cur">{b.priceCur}</span> : null}
            </div>
          )}
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

// La "línea de precio" resalta el monto SOLA: si trae **negritas** (data vieja)
// las respeta; si no, pone en negrita el primer segmento (antes del " · ").
function priceLineNodes(s: string): ReactNode {
  if (s.includes("**")) return renderInline(s);
  const idx = s.indexOf(" · ");
  if (idx === -1) return <b>{s}</b>;
  return (
    <>
      <b>{s.slice(0, idx)}</b>
      {s.slice(idx)}
    </>
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
  grupoToken,
}: {
  b: V2Dates;
  secnum: string;
  slug: string;
  slots: SlotAvailabilityPublic[];
  grupoToken?: string | null;
}) {
  const q = grupoToken ? `?grupo=${grupoToken}` : "";
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

        {b.priceLine ? <p className="price-line">{priceLineNodes(b.priceLine)}</p> : null}
        {slots.length === 0 ? (
          // Sin fechas abiertas: solicitar una fecha ES el camino principal.
          <>
            <p className="cap" style={{ marginTop: 8 }}>
              Por ahora no hay salidas abiertas — solicita una fecha para tu grupo.
            </p>
            <div className="actions">
              <a href={`/caminante/solicitar/${slug}`} className="btn btn-orange btn-arrow">
                Solicitar nueva fecha
              </a>
              <a href={`/caminante/registro/${slug}`} className="btn btn-outline-d">
                Registrarme
              </a>
            </div>
          </>
        ) : (
          <div className="actions">
            <a href={`/caminante/reservar/${slug}${q}`} className="btn btn-orange btn-arrow">
              Reservar y pagar
            </a>
            <a href={`/caminante/solicitar/${slug}`} className="btn btn-outline-d">
              Solicitar nueva fecha
            </a>
            <a href={`/caminante/registro/${slug}`} className="btn btn-outline-d">
              Registrarme
            </a>
          </div>
        )}
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

// CSS suplementario (aditivo, no toca los tokens bespoke): tira de logos en el
// hero (chips claros sobre la foto) + banda de logos en fondo claro.
const COLLAB_CSS = `
.collab-strip{margin-top:36px;display:flex;flex-direction:column;gap:12px;}
.collab-strip .lbl{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.72);}
.collab-strip-logos{display:flex;flex-wrap:wrap;align-items:center;gap:22px;}
/* Sobre la foto del hero el logo va como SILUETA BLANCA (sin caja), como la marca
   al pie del deck — la caja blanca se veía como calcomanía. */
.collab-chip{display:inline-flex;align-items:center;justify-content:center;height:34px;}
.collab-chip img{height:100%;width:auto;max-width:170px;object-fit:contain;display:block;filter:brightness(0) invert(1);opacity:.9;}
.collab-band{background:var(--panel);}
.collab-band-lbl{display:flex;justify-content:center;margin-bottom:26px;}
.collab-band-logos{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:30px 46px;}
.collab-band-logo{display:flex;flex-direction:column;align-items:center;gap:8px;}
.collab-band-logo img{height:56px;width:auto;max-width:200px;object-fit:contain;display:block;}
.collab-band-logo span{font-size:12px;color:var(--ink-soft);font-weight:500;letter-spacing:.02em;}
/* Chip "Operada por" — glass sobre el hero (regla de marca), clickeable → perfil. */
.op-chip{display:inline-flex;align-items:center;gap:9px;margin-top:26px;padding:9px 16px 9px 10px;border-radius:999px;background:rgba(255,255,255,.14);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.28);color:#fff;font-size:13.5px;text-decoration:none;transition:background .25s,border-color .25s;}
.op-chip:hover{background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.45);}
.op-avatar{width:26px;height:26px;border-radius:50%;object-fit:cover;display:block;background:#fff;}
.op-avatar-mark{background:rgba(255,255,255,.92) url('/landing/assets/logos/caminante-mark.svg') center/60% no-repeat;}
.op-chip .op-lbl{opacity:.75;font-size:12px;}
.op-chip .op-nm{font-weight:600;}
.op-chip .op-star{color:#ffd27a;font-weight:600;font-size:12.5px;}
.op-chip .op-arrow{opacity:.7;font-size:13px;transition:transform .25s;}
.op-chip:hover .op-arrow{transform:translateX(3px);}
`;

export default function ExperienceTemplateV2({
  experience,
  slots,
  grupoToken,
  sessionRole,
  operatorChip,
}: {
  experience: Experience;
  slots: SlotAvailabilityPublic[];
  // Token de grupo privado (ya sanitizado): los CTAs de reserva lo conservan
  // para que el flujo completo (página → checkout) siga viendo la salida privada.
  grupoToken?: string | null;
  // Rol de la sesión (server-side): entrada a "Mi espacio"/"Panel" en el nav.
  sessionRole?: "admin" | "caminante" | null;
  // Chip "Operada por" del hero (null = operador sin perfil público o sin 0020).
  operatorChip?: OperatorChip | null;
}) {
  const slug = experience.slug;
  // Entrada por rol en el nav de la experiencia (misma lógica que SiteChrome):
  // sin sesión → "Entrar" (rutea a login); caminante → "Mi espacio"; admin → "Panel".
  const cuentaHref =
    sessionRole === "admin"
      ? "/caminante/admin"
      : sessionRole === "caminante"
        ? "/caminante/perfil"
        : "/caminante/entrar";
  const cuentaLabel =
    sessionRole === "admin" ? "Panel" : sessionRole === "caminante" ? "Mi espacio" : "Entrar";
  const blocks = experience.page?.blocks ?? [];
  const collabs = (experience.page?.collaborators ?? []).filter((c) => c.logoUrl?.trim());
  // La banda de logos va después del último bloque "split" (guías/aliados); si no
  // hay ninguno, después del hero (índice 0).
  let collabAfterIdx = 0;
  blocks.forEach((b, i) => {
    if (b.type === "split") collabAfterIdx = i;
  });
  let n = 0;
  const secnumFor = (t: PageBlock["type"]) =>
    NUMBERED.has(t) ? String(++n).padStart(2, "0") : "";

  // Precio para el evento ViewContent (Meta Pixel): nivel base → precio base.
  // Es solo señal de valor; si no hay precio limpio, se omite (ViewContent no lo exige).
  const vcPriceRaw = experience.priceTiers?.[0]?.amount ?? experience.price?.amount ?? "";
  const vcPriceNum = Number(String(vcPriceRaw).replace(/[^\d.]/g, ""));
  const vcValue = Number.isFinite(vcPriceNum) && vcPriceNum > 0 ? vcPriceNum : undefined;

  return (
    <>
      <PixelEvent
        event="ViewContent"
        params={{
          content_ids: [slug],
          content_type: "product",
          ...(vcValue ? { value: vcValue, currency: "MXN" } : {}),
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: TEMPLATE_V2_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: COLLAB_CSS }} />

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
          <a href={cuentaHref}>{cuentaLabel}</a>
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
        <a href={cuentaHref}>
          <span className="sl">{"//"}</span>{cuentaLabel}
        </a>
        <a href="#fechas" className="btn btn-orange">
          Reservar
        </a>
      </div>

      {blocks.map((b, i) => {
        const secnum = secnumFor(b.type);
        let el: ReactNode = null;
        switch (b.type) {
          case "hero":
            el = <HeroBlock b={b} collaborators={collabs} operatorChip={operatorChip} />;
            break;
          case "split":
            el = <SplitBlock b={b} secnum={secnum} />;
            break;
          case "statement":
            el = <StatementBlock b={b} />;
            break;
          case "itinerary":
            el = <ItineraryBlock b={b} secnum={secnum} />;
            break;
          case "tariff":
            el = <TariffBlock b={b} secnum={secnum} tiers={experience.priceTiers} />;
            break;
          case "checklist":
            el = <ChecklistBlock b={b} secnum={secnum} />;
            break;
          case "faq":
            el = <FaqBlock b={b} />;
            break;
          case "packing":
            el = <PackingBlock b={b} secnum={secnum} />;
            break;
          case "dates":
            el = <DatesBlock b={b} secnum={secnum} slug={slug} slots={slots} grupoToken={grupoToken} />;
            break;
          case "closing":
            el = <ClosingBlock b={b} slug={slug} />;
            break;
          default:
            el = null;
        }
        // La banda de logos se inserta justo después del último bloque de guías.
        return (
          <Fragment key={i}>
            {el}
            {i === collabAfterIdx && collabs.length ? <CollaboratorsBand logos={collabs} /> : null}
          </Fragment>
        );
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
