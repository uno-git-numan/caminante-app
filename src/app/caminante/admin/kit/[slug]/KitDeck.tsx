// Renderiza las láminas de UNA pieza del kit como `.slide` dentro de un wrapper
// `.kit.<orient>` (server component, sin estado). El export (KitClient) serializa
// cada `.slide` a PNG. El sello CAMINANTE va en colores reales; los logos de
// colaboradores al pie. Cada `kind` de lámina tiene su markup con las clases de
// kit-css. Reutiliza el lenguaje visual del deck.
import type { ReactNode } from "react";
import type { Lamina, Foto } from "@/lib/kit/kit";

const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const GW =
  '<g class="gw"><path d="M532.87,98.77c-4.27,4.6-9.41,6.89-15.42,6.89-5.69,0-10.45-1.75-14.27-5.25-3.83-3.5-6.73-8.56-8.7-15.18-1.97-6.62-2.95-14.68-2.95-24.2s.98-17.77,2.95-24.45c1.97-6.67,4.87-11.76,8.7-15.26,3.83-3.5,8.58-5.25,14.27-5.25s10.42,2.11,14.52,6.32c4.1,4.21,6.97,10.36,8.61,18.46l18.05-.98c-2.3-12.58-7.08-22.37-14.36-29.37-7.27-7-16.22-10.5-26.82-10.5-9.41,0-17.37,2.49-23.87,7.47-6.51,4.98-11.46,12-14.85,21.08-3.39,9.08-5.08,19.91-5.08,32.49s1.69,23.24,5.08,32.32c3.39,9.08,8.34,16.08,14.85,21,6.51,4.92,14.46,7.38,23.87,7.38,11.26,0,20.56-3.72,27.89-11.16,7.33-7.44,11.98-17.83,13.95-31.17l-17.88-.82c-1.42,8.86-4.27,15.59-8.53,20.18"/><path d="M636.87,72.84l14.54-52.34,14.54,52.34h-29.09ZM640.25,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88L662.57,2.62h-22.31Z"/><polygon points="784.88 77.66 766.51 2.62 743.54 2.62 743.54 119.11 760.11 119.11 760.11 29.17 778.32 105 791.45 105 809.66 29.17 809.66 119.11 826.23 119.11 826.23 2.62 803.26 2.62 784.88 77.66"/><polygon points="873.07 18.87 900.97 18.87 900.97 102.87 873.07 102.87 873.07 119.11 945.92 119.11 945.92 102.87 918.03 102.87 918.03 18.87 945.92 18.87 945.92 2.62 873.07 2.62 873.07 18.87"/><polygon points="1051.99 94.46 1013.77 2.62 992.77 2.62 992.77 119.11 1009.67 119.11 1009.67 27.28 1047.89 119.11 1068.89 119.11 1068.89 2.62 1051.99 2.62 1051.99 94.46"/><path d="M1146.48,72.84l14.54-52.34,14.54,52.34h-29.09ZM1149.87,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88l-34.13-116.49h-22.31Z"/><polygon points="1312.38 94.46 1274.15 2.62 1253.15 2.62 1253.15 119.11 1270.05 119.11 1270.05 27.28 1308.28 119.11 1329.28 119.11 1329.28 2.62 1312.38 2.62 1312.38 94.46"/><polygon points="1376.12 18.87 1410.25 18.87 1410.25 119.11 1427.31 119.11 1427.31 18.87 1461.44 18.87 1461.44 2.62 1376.12 2.62 1376.12 18.87"/><polygon points="1508.28 2.62 1508.28 119.11 1581.13 119.11 1581.13 102.87 1525.51 102.87 1525.51 68.58 1577.85 68.58 1577.85 52.83 1525.51 52.83 1525.51 18.87 1579.81 18.87 1579.81 2.62 1508.28 2.62"/></g>';
const WORD = `<svg viewBox="0 0 1581.13 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}${GW}</svg>`;
const MARK = `<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}</svg>`;

// **negrita** → <b>
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>,
  );
}

type Collab = { name: string; logoUrl: string };

function Bg({ f }: { f: Foto }) {
  return f.url ? <img className="k-bg" src={f.url} alt={f.alt || ""} /> : <div className="k-bg" style={{ background: "var(--forest)" }} />;
}
function Top({ dark, momento }: { dark: boolean; momento: string }) {
  return (
    <div className="k-top">
      <span className={`k-word${dark ? " on-dark" : ""}`} dangerouslySetInnerHTML={{ __html: WORD }} />
      <span className={`k-tag${dark ? " on-dark" : ""}`}>{momento}</span>
    </div>
  );
}
function Foot({ dark, collabs }: { dark: boolean; collabs: Collab[] }) {
  return (
    <div className={`k-foot${dark ? " on-dark" : ""}`}>
      <span className="fm" dangerouslySetInnerHTML={{ __html: MARK }} />
      {collabs.slice(0, 3).map((c, i) => (
        <img key={i} src={c.logoUrl} alt={c.name} />
      ))}
    </div>
  );
}

// ── Sistema EDITORIAL (serie E) ───────────────────────────────────────────────
// El promocional lleva chrome de marca en TODAS las láminas (sello + momento +
// pie); el editorial casi no: sello mínimo en la portada y firma en el cierre.
// Cada lámina conserva la clase `.slide` (el exportador rasteriza
// `[data-piece] .slide`) y suma `.edu-slide` para lo visual.
function EduMark({ sm }: { sm?: boolean }) {
  return (
    <span className={`edu-mark${sm ? " edu-sm" : ""}`}>
      <span dangerouslySetInnerHTML={{ __html: MARK }} />
      <span className="edu-wm">Caminante</span>
    </span>
  );
}
function EduPhoto({ f }: { f: Foto }) {
  return (
    <div className="edu-photo">
      {f.url ? <img src={f.url} alt={f.alt || ""} /> : <div style={{ width: "100%", height: "100%", background: "var(--forest)" }} />}
    </div>
  );
}

type EduLamina = Extract<Lamina, { kind: `edu-${string}` }>;
const isEdu = (l: Lamina): l is EduLamina => l.kind.startsWith("edu-");

function EduSlide({ l }: { l: EduLamina }) {
  switch (l.kind) {
    case "edu-portada":
      return (
        <div className="slide edu-slide">
          <EduPhoto f={l.bg} /><div className="edu-sh-portada" />
          <div className="edu-p-mark"><EduMark sm /></div>
          <div className="edu-p-body">
            <div className="edu-hook">{inline(l.hook)}</div>
            <div className="edu-teaser">{l.teaser}</div>
            <div className="edu-arrow">→</div>
          </div>
        </div>
      );
    case "edu-cuerpo":
      return (
        <div className="slide edu-slide">
          <EduPhoto f={l.bg} /><div className="edu-sh-bl" />
          <div className="edu-b-body">
            <div className="edu-claim">{inline(l.claim)}</div>
            {l.caption ? <div className="edu-caption">{inline(l.caption)}</div> : null}
          </div>
          {l.src ? <div className="edu-credit">{l.src}</div> : null}
        </div>
      );
    case "edu-ficha":
      return (
        <div className="slide edu-slide">
          <EduPhoto f={l.bg} /><div className="edu-sh-bl" />
          <div className="edu-ficha">
            <div className="edu-nom">{l.nom}</div>
            {l.sci ? <div className="edu-sci">{l.sci}</div> : null}
            <div className="edu-rows">
              {l.rows.map((r, i) => (
                <div key={i}>
                  {i ? <div className="edu-hair" /> : null}
                  <div className="edu-r"><span className="edu-k">{r.k}</span><span className="edu-v">{inline(r.v)}</span></div>
                </div>
              ))}
            </div>
          </div>
          {l.src ? <div className="edu-ficha-src">{l.src}</div> : null}
        </div>
      );
    case "edu-cierre":
      return (
        <div className="slide edu-slide">
          <EduPhoto f={l.bg} /><div className="edu-sh-bottom" />
          <div className="edu-c-body">
            <div className="edu-synth">{l.synth}</div>
            <div className="edu-turn">{inline(l.turn)}</div>
          </div>
          <div className="edu-sign"><EduMark /><span className="edu-exp">{l.exp}</span></div>
        </div>
      );
    case "edu-postal":
      return (
        <div className="slide edu-slide">
          <EduPhoto f={l.bg} /><div className="edu-sh-bl" />
          <div className="edu-postal-mark"><EduMark sm /></div>
          <div className="edu-postal-line">{l.line}</div>
        </div>
      );
    case "edu-dcover":
      return (
        <div className="slide edu-slide">
          <EduPhoto f={l.bg} /><div className="edu-sh-pb" />
          <div className="edu-pb-mark"><EduMark sm /></div>
          <div className="edu-pb-center">
            <div className="edu-pb-h">{l.h}</div>
            <div className="edu-pb-t">{l.t}</div>
            <div className="edu-pb-index">{l.index}</div>
          </div>
          <div className="edu-pb-arrow">→</div>
        </div>
      );
    case "edu-dentry":
      return (
        <div className="slide edu-slide">
          <div className="edu-plate-photo">{l.img.url ? <img src={l.img.url} alt={l.term} /> : null}</div>
          <div className="edu-plate-band">
            <div className="edu-plate-term">{l.term}</div>
            {l.cat ? <div className="edu-plate-cat">{l.cat}</div> : null}
            <div className="edu-plate-def">{inline(l.def)}</div>
            <div className="edu-plate-src">{l.src || ""}</div>
          </div>
        </div>
      );
    case "edu-retrato":
      return (
        <div className="slide edu-slide">
          <EduPhoto f={l.bg} /><div className="edu-sh-bl" />
          <div className="edu-b-body">
            <div className="edu-claim" style={{ fontSize: 30 }}>{l.cita}</div>
            <div style={{ marginTop: 22, borderTop: "1px solid rgba(255,255,255,.32)", paddingTop: 14 }}>
              <div style={{ fontWeight: 300, fontSize: 22 }}>{l.name}</div>
              {l.role ? (
                <div style={{ fontFamily: '"Geist Mono",ui-monospace,monospace', fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.72, marginTop: 5 }}>
                  {l.role}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
  }
}

function Slide({ l, momento, collabs }: { l: Lamina; momento: string; collabs: Collab[] }) {
  if (isEdu(l)) return <EduSlide l={l} />;
  // dark = fondo foto/oscuro (sello y texto en blanco); light = panel claro.
  const dark = !(l.kind === "lista" || l.kind === "incluye" || l.kind === "perfil");
  const chrome = (
    <>
      <Top dark={dark} momento={momento} />
      <Foot dark={dark} collabs={collabs} />
    </>
  );
  switch (l.kind) {
    case "cover":
      return (
        <div className="slide l-cover">
          <Bg f={l.bg} /><div className="k-veil veil-btm" />{chrome}
          <div className="k-in">
            <span className="k-eyebrow"><span className="sl">//</span> {l.eyebrow}</span>
            <h1 className="k-title">{l.title} {l.accent ? <em className="ac">{l.accent}</em> : null}</h1>
            {l.tag ? <p className="tag">{l.tag}</p> : null}
          </div>
        </div>
      );
    case "fact":
      return (
        <div className="slide l-fact">
          <Bg f={l.bg} /><div className="k-veil veil-btm" />{chrome}
          <div className="k-in">
            <div className="n">{l.n}</div>
            <div className="lbl">{l.label}</div>
            {l.source ? <div className="src">{l.source}</div> : null}
          </div>
        </div>
      );
    case "foto":
      return (
        <div className="slide l-foto">
          <Bg f={l.bg} /><div className="k-veil veil-btm" />{chrome}
          {l.line || l.sub ? (
            <div className="k-in">
              {l.line ? <div className="line">{l.line}</div> : null}
              {l.sub ? <div className="sub">{l.sub}</div> : null}
            </div>
          ) : null}
        </div>
      );
    case "lista":
      return (
        <div className="slide l-lista">
          {chrome}
          <div className="k-in">
            <span className="k-eyebrow"><span className="sl">//</span> {l.eyebrow}</span>
            <h2 className="k-title">{l.title} {l.accent ? <em className="ac">{l.accent}</em> : null}</h2>
            {l.items.map((it, i) => (
              <div className="it" key={i}><span className="mk">{l.mark || "—"}</span>{it}</div>
            ))}
          </div>
        </div>
      );
    case "incluye":
      return (
        <div className="slide l-incluye">
          {chrome}
          <div className="k-in">
            <span className="k-eyebrow"><span className="sl">//</span> {l.eyebrow}</span>
            <h2 className="k-title">{l.title} {l.accent ? <em className="ac">{l.accent}</em> : null}</h2>
            <div className="cols">
              <div>
                <div className="ch yes-h">{l.yesT}</div>
                {l.yes.map((x, i) => <div className="inc yes" key={i}><span className="mk">+</span>{x}</div>)}
              </div>
              {l.no.length ? (
                <div>
                  <div className="ch no-h">{l.noT}</div>
                  {l.no.map((x, i) => <div className="inc no" key={i}><span className="mk">{l.noMark || "−"}</span>{x}</div>)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
    case "qa":
      return (
        <div className="slide l-qa">
          <Bg f={l.bg} /><div className="k-veil veil-mid" />{chrome}
          <div className="k-in">
            <div className="card">
              <span className="k-eyebrow"><span className="sl">//</span> {l.eyebrow}</span>
              {l.qa.map((x, i) => (
                <div className="qa" key={i}><div className="q">{x.q}</div><div className="a">{x.a}</div></div>
              ))}
            </div>
          </div>
        </div>
      );
    case "dia":
      return (
        <div className="slide l-dia">
          <Bg f={l.bg} /><div className="k-veil veil-btm" />{chrome}
          <div className="k-in">
            <div className="card">
              {l.num ? <div className="dnum">{l.num}</div> : null}
              <div className="dlab">{l.lab}</div>
              <ul>{l.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>
            </div>
          </div>
        </div>
      );
    case "precio":
      return (
        <div className="slide l-precio">
          <Bg f={l.bg} /><div className="k-veil veil-mid" />{chrome}
          <div className="k-in">
            <span className="k-eyebrow"><span className="sl">//</span> {l.eyebrow}</span>
            <h2 className="k-title">{l.title} {l.accent ? <em className="ac">{l.accent}</em> : null}</h2>
            <div className="card">
              {l.tier ? <div className="tier">{l.tier}</div> : null}
              <div className="price">{l.price}{l.cur ? <span className="cur">{l.cur}</span> : null}</div>
              {l.lead ? <div className="lead">{l.lead}</div> : null}
              {l.tiers?.length ? (
                <div className="tiers">
                  {l.tiers.map((t, i) => <div className="tier-r" key={i}><span className="tl">{t.l}</span><span>{t.v}</span></div>)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
    case "cupo":
      return (
        <div className="slide l-cupo">
          <Bg f={l.bg} /><div className="k-veil veil-mid" />{chrome}
          <div className="k-in">
            <span className="k-eyebrow"><span className="sl">//</span> Cupo</span>
            <div className="big">{l.n}</div>
            <div className="lugares">{l.n === 1 ? "lugar disponible" : "lugares disponibles"}</div>
            <div className="exp">{l.experiencia}</div>
            <div className="fecha">{l.fecha}</div>
          </div>
        </div>
      );
    case "cita":
      return (
        <div className="slide l-cita">
          <Bg f={l.bg || { url: "" }} /><div className="k-veil veil-mid" />{chrome}
          <div className="k-in">
            {l.stars ? <div className="stars">{"★".repeat(Math.min(5, Math.round(l.stars)))}</div> : null}
            <div className="quote">“{l.quote}”</div>
            <div className="who">— {l.author}</div>
          </div>
        </div>
      );
    case "perfil":
      return (
        <div className="slide l-perfil">
          {l.photo?.url ? <div className="ph"><img src={l.photo.url} alt={l.name} /></div> : null}
          {chrome}
          <div className="k-in">
            <div className="body">
              <div className="role">{l.role}</div>
              <div className="name">{l.name}</div>
              {l.cred ? <div className="cred">{l.cred}</div> : null}
              {l.body ? <div className="bio">{l.body}</div> : null}
            </div>
          </div>
        </div>
      );
    case "cierre":
      return (
        <div className="slide l-cierre">
          <Bg f={l.bg} /><div className="k-veil veil-btm" />{chrome}
          <div className="k-in">
            <span className="k-eyebrow"><span className="sl">//</span> {l.eyebrow}</span>
            <h2 className="k-title">{l.title} {l.accent ? <em className="ac">{l.accent}</em> : null}</h2>
            <span className="cta">{l.cta} →</span>
          </div>
        </div>
      );
  }
}

export default function KitDeck({
  laminas,
  orient,
  momento,
  collaborators,
}: {
  laminas: Lamina[];
  orient: "post" | "story";
  momento: string;
  collaborators: Collab[];
}) {
  return (
    <div className={`kit ${orient}`}>
      {laminas.map((l, i) => (
        <Slide key={i} l={l} momento={momento} collabs={collaborators} />
      ))}
    </div>
  );
}
