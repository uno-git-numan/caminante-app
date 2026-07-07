// Deck imprimible (flyer) de una experiencia: un slide por sección, tamaño fijo
// (16:9 horizontal / 9:16 vertical), al estilo de los flyers de referencia.
// Se alimenta de los MISMOS page.blocks del diseño v2. Lo usa la ruta de print.
import type { ReactNode } from "react";
import type {
  Experience,
  V2Hero,
  V2Split,
  V2Statement,
  V2Itinerary,
  V2Tariff,
  V2Checklist,
  V2Faq,
  V2Packing,
  V2Closing,
  V2Image,
} from "@/lib/experiences/types";
import type { SlotAvailabilityPublic } from "@/lib/experiences/availability";
import { BRAND_MARK, BRAND_WORD } from "@/lib/experiences/brand-svg";

function md(text: string): ReactNode {
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  const out: ReactNode[] = [];
  let last = 0, k = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<b key={k++}>{m[1]}</b>);
    else out.push(<em key={k++}>{m[2]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}
const pos = (im: V2Image) => (im.pos ? { objectPosition: im.pos } : undefined);
const Mark = ({ dark }: { dark?: boolean }) => (
  <span className={`s-mark${dark ? " on-dark" : ""}`} dangerouslySetInnerHTML={{ __html: BRAND_MARK }} />
);
function Title({ t, accent, cls }: { t: string; accent?: string; cls?: string }) {
  return (
    <h2 className={`s-title${cls ? " " + cls : ""}`}>
      {t}
      {accent ? <> <em className="ac">{accent}</em></> : null}
    </h2>
  );
}
function Media({ media }: { media: V2Split["media"] }) {
  if (media.kind === "mosaic") {
    return (
      <div className="s-media">
        <div className="s-mosaic">
          {media.images.slice(0, 4).map((im, i) => (
            <div className={`m${im.big ? " big" : ""}`} key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt={im.alt || ""} style={pos(im)} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  const im = media.images[0];
  return (
    <div className="s-media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {im ? <img src={im.url} alt={im.alt || ""} style={pos(im)} /> : null}
    </div>
  );
}
function photoMedia(url?: string, alt?: string) {
  if (!url) return null;
  return (
    <div className="s-media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt || ""} />
    </div>
  );
}

// ── slides ──
function TopBar({ pager, dark }: { pager?: string; dark?: boolean }) {
  return (
    <div className="panel-top">
      <Mark dark={dark} />
      {pager ? <span className={`s-pager${dark ? " on-dark" : ""}`}>{pager}</span> : null}
    </div>
  );
}

function CoverSlide({ h, datesMeta }: { h: V2Hero; datesMeta: string }) {
  const tag = (h.sub || "").split(/(?<=\.)\s+/)[0];
  return (
    <div className="slide bleed cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={h.bg.url} alt={h.bg.alt || ""} style={pos(h.bg)} />
      <div className="veil veil-btm" />
      <div className="s-top">
        <Mark dark />
        {datesMeta ? <span className="s-meta">{datesMeta}</span> : null}
      </div>
      <div className="inner">
        <div className="cover-btm">
          <span className="eyebrow-w">{h.eyebrow}</span>
          <span className="wordmark" dangerouslySetInnerHTML={{ __html: BRAND_WORD }} />
          {tag ? <div className="tag">{tag}</div> : null}
        </div>
      </div>
    </div>
  );
}

function SplitSlide({ b, pager }: { b: V2Split; pager: string }) {
  const panel = (
    <div className="s-panel">
      <TopBar pager={pager} />
      <div className="panel-body">
        <span className="s-eyebrow"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <Title t={b.title} accent={b.titleAccent} />
        {b.subEyebrow ? <div className="s-sub-eyebrow">{b.subEyebrow}</div> : null}
        {b.points ? (
          <div className="s-points">{b.points.map((p, i) => <div className="pt" key={i}>{p}</div>)}</div>
        ) : null}
        {b.paragraphs ? b.paragraphs.map((p, i) => <p className="s-para" key={i}>{md(p)}</p>) : null}
        {b.items ? (
          <div className="s-allies">
            {b.items.map((it, i) => (
              <div className="s-ally" key={i}>
                <span className="dot" />
                <div><span className="nm">{it.name}</span>{it.role ? <>  <span className="ro">{it.role}</span></> : null}</div>
              </div>
            ))}
          </div>
        ) : null}
        {b.lead ? <p className="s-lead">{md(b.lead)}</p> : null}
      </div>
    </div>
  );
  const media = <Media media={b.media} />;
  return (
    <div className="slide">
      <div className="s-split">
        {b.media.side === "left" ? <>{media}{panel}</> : <>{panel}{media}</>}
      </div>
    </div>
  );
}

function StatementSlide({ b }: { b: V2Statement }) {
  return (
    <div className="slide bleed statement">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={pos(b.bg)} />
      <div className="veil veil-soft" />
      <div className="inner">
        <div className="st-btm">
          <span className="s-eyebrow on-dark">{b.eyebrowPre ? <>{b.eyebrowPre} </> : null}<span className="sl">{"//"}</span> {b.eyebrow}</span>
          <Title t={b.title} accent={b.titleAccent} />
          {b.body ? <p>{b.body}</p> : null}
          {b.quote ? <div className="quote">{b.quote}</div> : null}
        </div>
      </div>
    </div>
  );
}

function ItinSlide({ b, pager }: { b: V2Itinerary; pager: string }) {
  return (
    <div className="slide bleed itin">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={pos(b.bg)} />
      <div className="veil veil-even" />
      <div className="s-top"><Mark dark /><span className="s-pager on-dark">{pager}</span></div>
      <div className="it-head">
        <span className="s-eyebrow on-dark"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <Title t={b.title} accent={b.titleAccent} />
      </div>
      <div className="days">
        {b.days.slice(0, 4).map((d, i) => (
          <div className="day" key={i}>
            <div className="dnum">{d.num || String(i + 1).padStart(2, "0")}</div>
            <div className="dlab">{d.lab}</div>
            <ul>{d.items.map((li, j) => <li key={j}>{md(li)}</li>)}</ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function TariffSlide({ b, pager, bg, tiers }: { b: V2Tariff; pager: string; bg?: string; tiers: { label: string; amount: string }[] }) {
  const money = (a: string) => {
    const d = a.replace(/[^\d]/g, "");
    return d ? "$" + Number(d).toLocaleString("es-MX") : a;
  };
  const lows = tiers.map((t) => Number(t.amount.replace(/[^\d]/g, ""))).filter((n) => n > 0).sort((x, y) => x - y);
  return (
    <div className="slide bleed tariff-s">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {bg ? <img className="bg" src={bg} alt="" /> : <div className="bg" style={{ background: "var(--forest)" }} />}
      <div className="veil veil-soft" />
      <div className="s-top"><Mark dark /><span className="s-pager on-dark">{pager}</span></div>
      <div className="tf-in">
        <span className="s-eyebrow on-dark"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <Title t={b.title} accent={b.titleAccent} />
        <div className="tf-card">
          <div className="tier">{b.tier}</div>
          {tiers.length ? (
            <>
              <div className="tf-row">
                <div className="tf-price">Desde {money(String(lows[0] || 0))}<span className="cur">{b.priceCur}</span></div>
                {b.availV ? <div className="tf-av"><span className="k">{b.availK || "Disponibilidad"}</span><span className="v">{b.availV}</span></div> : null}
              </div>
              <div className="tf-tiers">
                {tiers.map((t, i) => <div className="tf-tier" key={i}><span className="tl">{t.label}</span><span>{money(t.amount)}</span></div>)}
              </div>
            </>
          ) : (
            <div className="tf-row">
              <div className="tf-price">{b.price}<span className="cur">{b.priceCur}</span></div>
              {b.availV ? <div className="tf-av"><span className="k">{b.availK || "Disponibilidad"}</span><span className="v">{b.availV}</span></div> : null}
            </div>
          )}
        </div>
        {b.lead ? <p className="tf-lead">{b.lead}</p> : null}
      </div>
    </div>
  );
}

function ChecklistSlide({ b, pager, photo }: { b: V2Checklist; pager: string; photo?: string }) {
  const panel = (
    <div className="s-panel">
      <TopBar pager={pager} />
      <div className="panel-body">
        <span className="s-eyebrow"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <div className="s-cols" style={{ marginTop: 22 }}>
          <div>
            <div className="s-col-h yes-h">{b.yesTitle}</div>
            {b.yesItems.map((it, i) => <div className="inc yes" key={i}><span className="mk">{b.yesMark || "+"}</span>{it}</div>)}
          </div>
          <div>
            <div className="s-col-h no-h">{b.noTitle}</div>
            {b.noItems.map((it, i) => <div className="inc no" key={i}><span className="mk">{b.noMark || "−"}</span>{it}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
  const media = photoMedia(photo);
  return <div className="slide"><div className="s-split">{panel}{media}</div></div>;
}

function PackingSlide({ b, pager }: { b: V2Packing; pager: string }) {
  const panel = (
    <div className="s-panel">
      <TopBar pager={pager} />
      <div className="panel-body">
        <span className="s-eyebrow"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <Title t={b.title} accent={b.titleAccent} />
        {b.cap ? <div className="s-cap">{b.cap}</div> : null}
        <div className="s-pack">{b.items.map((it, i) => <div className="s-pk" key={i}><span className="box" />{it}</div>)}</div>
      </div>
    </div>
  );
  return <div className="slide"><div className="s-split">{panel}{photoMedia(b.photo.url, b.photo.alt)}</div></div>;
}

function FaqSlide({ b, pager }: { b: V2Faq; pager: string }) {
  return (
    <div className="slide bleed faq-s">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={pos(b.bg)} />
      <div className="veil veil-even" />
      <div className="s-top"><Mark dark /><span className="s-pager on-dark">{pager}</span></div>
      <div className="faq-card">
        <span className="s-eyebrow"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        {b.qa.map((x, i) => <div className="qa" key={i}><div className="q">{x.q}</div><div className="a">{x.a}</div></div>)}
      </div>
    </div>
  );
}

function ClosingSlide({ b, cupo }: { b: V2Closing; cupo: string }) {
  return (
    <div className="slide bleed closing">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={pos(b.bg)} />
      <div className="veil veil-btm" />
      <div className="s-top">
        <span className="s-mark on-dark" style={{ height: 30 }} dangerouslySetInnerHTML={{ __html: BRAND_WORD }} />
        {cupo ? <span className="pill">{cupo}</span> : null}
      </div>
      <div className="inner">
        <div className="close-btm">
          <div className="c-l">
            <span className="s-eyebrow"><span className="sl">{"//"}</span> {b.eyebrow}</span>
            <Title t={b.title} accent={b.titleAccent} />
          </div>
          <div className="contact">
            {b.contacts.map((c, i) => <div className="crow" key={i}><span className="k">{c.lbl}</span><span className="v">{c.val}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExperienceDeck({
  experience,
  slots,
  orient,
}: {
  experience: Experience;
  slots: SlotAvailabilityPublic[];
  orient: "h" | "v";
}) {
  const blocks = experience.page?.blocks ?? [];
  const gallery = experience.gallery ?? [];
  const hero = blocks.find((b) => b.type === "hero") as V2Hero | undefined;
  const heroBgUrl = hero?.bg.url;

  // meta de fechas para la portada + cupo para el cierre
  const labels = slots.map((s) => s.label).filter(Boolean);
  const datesMeta = labels.length
    ? `${labels.length} ${labels.length === 1 ? "fecha" : "fechas"}: ${labels.join(" · ")}`
    : experience.estado || "";
  const tariff = blocks.find((b) => b.type === "tariff") as V2Tariff | undefined;
  const cupo = tariff?.availV ? `Cupo limitado · ${tariff.availV}` : "";

  // numeración (todos menos portada y cierre)
  const numberable = blocks.filter((b) => b.type !== "hero" && b.type !== "closing" && b.type !== "dates");
  const total = numberable.length;
  let n = 0;
  const pagerFor = () => `${String(++n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <div className={`deck ${orient}`}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "hero":
            return <CoverSlide key={i} h={b} datesMeta={datesMeta} />;
          case "split":
            return <SplitSlide key={i} b={b} pager={pagerFor()} />;
          case "statement":
            return <StatementSlide key={i} b={b} />;
          case "itinerary":
            return <ItinSlide key={i} b={b} pager={pagerFor()} />;
          case "tariff":
            return <TariffSlide key={i} b={b} pager={pagerFor()} bg={gallery[0] || heroBgUrl} tiers={experience.priceTiers ?? []} />;
          case "checklist":
            return <ChecklistSlide key={i} b={b} pager={pagerFor()} photo={gallery[1] || gallery[0]} />;
          case "packing":
            return <PackingSlide key={i} b={b} pager={pagerFor()} />;
          case "faq":
            return <FaqSlide key={i} b={b} pager={pagerFor()} />;
          case "closing":
            return <ClosingSlide key={i} b={b} cupo={cupo} />;
          default:
            return null; // dates → no slide
        }
      })}
    </div>
  );
}
