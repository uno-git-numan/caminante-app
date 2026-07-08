// Deck imprimible (flyer) de una experiencia: un slide por sección, tamaño fijo
// (16:9 horizontal / 9:16 vertical), al estilo de los flyers de referencia.
// Se alimenta de los MISMOS page.blocks del diseño v2. Lo usa la ruta de print.
import type { ReactNode } from "react";
import type {
  Experience,
  V2Hero,
  V2Split,
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

// ── marca discreta al pie de TODOS los slides ──
type Collab = { name: string; logoUrl: string };
function BrandFoot({ collabs, dark, inPanel }: { collabs: Collab[]; dark?: boolean; inPanel?: boolean }) {
  return (
    <div className={`brandfoot${dark ? " on-dark" : ""}${inPanel ? " in-panel" : ""}`}>
      <span className="bf-mark" dangerouslySetInnerHTML={{ __html: BRAND_MARK }} />
      {collabs
        .filter((c) => c.logoUrl)
        .map((c, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={c.logoUrl} alt={c.name || ""} />
        ))}
    </div>
  );
}

// ── slides ──
function TopBar({ pager, dark }: { pager?: string; dark?: boolean }) {
  return (
    <div className="panel-top">
      <span />
      {pager ? <span className={`s-pager${dark ? " on-dark" : ""}`}>{pager}</span> : null}
    </div>
  );
}

function CoverSlide({ h, datesMeta, collabs }: { h: V2Hero; datesMeta: string; collabs: Collab[] }) {
  const tag = (h.sub || "").split(/(?<=\.)\s+/)[0];
  return (
    <div className="slide bleed cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={h.bg.url} alt={h.bg.alt || ""} style={pos(h.bg)} />
      <div className="veil veil-btm" />
      <div className="s-top">
        <span />
        {datesMeta ? <span className="s-meta">{datesMeta}</span> : null}
      </div>
      <div className="inner">
        <div className="cover-btm">
          <span className="eyebrow-w">{h.eyebrow}</span>
          <h1 className="cover-title">
            {h.title}
            {h.titleAccent ? <> <em className="ac">{h.titleAccent}</em></> : null}
          </h1>
          {tag ? <div className="tag">{tag}</div> : null}
        </div>
      </div>
      <BrandFoot collabs={collabs} dark />
    </div>
  );
}

function SplitSlide({ b, pager, collabs }: { b: V2Split; pager: string; collabs: Collab[] }) {
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
      <BrandFoot collabs={collabs} inPanel />
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

function ItinSlide({ b, pager, collabs }: { b: V2Itinerary; pager: string; collabs: Collab[] }) {
  const days = b.days.slice(0, 4);
  return (
    <div className="slide bleed itin">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={pos(b.bg)} />
      <div className="veil veil-even" />
      <div className="s-top"><span /><span className="s-pager on-dark">{pager}</span></div>
      <div className="it-head">
        <span className="s-eyebrow on-dark"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <Title t={b.title} accent={b.titleAccent} />
      </div>
      <div className={`days d${days.length}`}>
        {days.map((d, i) => (
          <div className="day glassify" key={i}>
            <div className="dnum">{d.num || String(i + 1).padStart(2, "0")}</div>
            <div className="dlab">{d.lab}</div>
            <ul>{d.items.map((li, j) => <li key={j}>{md(li)}</li>)}</ul>
          </div>
        ))}
      </div>
      <BrandFoot collabs={collabs} dark />
    </div>
  );
}

function TariffSlide({ b, pager, bg, tiers, collabs }: { b: V2Tariff; pager: string; bg?: string; tiers: { label: string; amount: string }[]; collabs: Collab[] }) {
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
      <div className="s-top"><span /><span className="s-pager on-dark">{pager}</span></div>
      <div className="tf-in">
        <span className="s-eyebrow on-dark"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <Title t={b.title} accent={b.titleAccent} />
        <div className="tf-card glassify">
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
      <BrandFoot collabs={collabs} dark />
    </div>
  );
}

function ChecklistSlide({ b, pager, photo, collabs }: { b: V2Checklist; pager: string; photo?: string; collabs: Collab[] }) {
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
      <BrandFoot collabs={collabs} inPanel />
    </div>
  );
  const media = photoMedia(photo);
  return <div className="slide"><div className="s-split">{panel}{media}</div></div>;
}

function PackingSlide({ b, pager, collabs }: { b: V2Packing; pager: string; collabs: Collab[] }) {
  const panel = (
    <div className="s-panel">
      <TopBar pager={pager} />
      <div className="panel-body">
        <span className="s-eyebrow"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        <Title t={b.title} accent={b.titleAccent} />
        {b.cap ? <div className="s-cap">{b.cap}</div> : null}
        <div className="s-pack">{b.items.map((it, i) => <div className="s-pk" key={i}><span className="box" />{it}</div>)}</div>
      </div>
      <BrandFoot collabs={collabs} inPanel />
    </div>
  );
  return <div className="slide"><div className="s-split">{panel}{photoMedia(b.photo.url, b.photo.alt)}</div></div>;
}

function FaqSlide({ b, pager, collabs }: { b: V2Faq; pager: string; collabs: Collab[] }) {
  return (
    <div className="slide bleed faq-s">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={pos(b.bg)} />
      <div className="veil veil-even" />
      <div className="s-top"><span /><span className="s-pager on-dark">{pager}</span></div>
      <div className="faq-card glassify">
        <span className="s-eyebrow"><span className="sl">{"//"}</span> {b.eyebrow}</span>
        {b.qa.map((x, i) => <div className="qa" key={i}><div className="q">{x.q}</div><div className="a">{x.a}</div></div>)}
      </div>
      <BrandFoot collabs={collabs} dark />
    </div>
  );
}

function ClosingSlide({ b, cupo, collabs }: { b: V2Closing; cupo: string; collabs: Collab[] }) {
  return (
    <div className="slide bleed closing">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg" src={b.bg.url} alt={b.bg.alt || ""} style={pos(b.bg)} />
      <div className="veil veil-btm" />
      <div className="s-top">
        <span className="s-mark on-dark" style={{ height: 24 }} dangerouslySetInnerHTML={{ __html: BRAND_WORD }} />
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
      <BrandFoot collabs={collabs} dark />
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
  const collabs: Collab[] = experience.page?.collaborators ?? [];
  const hero = blocks.find((b) => b.type === "hero") as V2Hero | undefined;
  const heroBgUrl = hero?.bg.url;

  // meta de fechas para la portada + cupo para el cierre
  const labels = slots.map((s) => s.label).filter(Boolean);
  const datesMeta = labels.length
    ? `${labels.length} ${labels.length === 1 ? "fecha" : "fechas"}: ${labels.join(" · ")}`
    : experience.estado || "";
  const tariff = blocks.find((b) => b.type === "tariff") as V2Tariff | undefined;
  const cupo = tariff?.availV ? `Cupo limitado · ${tariff.availV}` : "";

  // Selección EXPLÍCITA de slides (orden fijo del flyer, independiente del
  // orden del array): portada · experiencia · itinerario · precio · qué
  // incluye · comunidad · qué llevar · faq · cierre. Lo demás (statement,
  // guías/variedades/aliados, fechas) NO va al flyer.
  const splits = blocks.filter((b): b is V2Split => b.type === "split");
  const expSplit = splits.find((b) => b.anchor === "experiencia" || (b.frame === "xp" && b.points));
  const comunidad = splits.find((b) => b !== expSplit && /comunidad/i.test(`${b.eyebrow} ${b.title}`));
  const itin = blocks.find((b): b is V2Itinerary => b.type === "itinerary");
  const checklist = blocks.find((b): b is V2Checklist => b.type === "checklist");
  const packing = blocks.find((b): b is V2Packing => b.type === "packing");
  const faq = blocks.find((b): b is V2Faq => b.type === "faq");
  const closing = blocks.find((b): b is V2Closing => b.type === "closing");

  // numeración: todos los slides intermedios (sin portada ni cierre)
  const middle = [expSplit, itin, tariff, checklist, comunidad, packing, faq].filter(Boolean).length;
  let n = 0;
  const pagerFor = () => `${String(++n).padStart(2, "0")} / ${String(middle).padStart(2, "0")}`;

  return (
    <div className={`deck ${orient}`}>
      {hero ? <CoverSlide h={hero} datesMeta={datesMeta} collabs={collabs} /> : null}
      {expSplit ? <SplitSlide b={expSplit} pager={pagerFor()} collabs={collabs} /> : null}
      {itin ? <ItinSlide b={itin} pager={pagerFor()} collabs={collabs} /> : null}
      {tariff ? <TariffSlide b={tariff} pager={pagerFor()} bg={gallery[0] || heroBgUrl} tiers={experience.priceTiers ?? []} collabs={collabs} /> : null}
      {checklist ? <ChecklistSlide b={checklist} pager={pagerFor()} photo={gallery[1] || gallery[0]} collabs={collabs} /> : null}
      {comunidad ? <SplitSlide b={comunidad} pager={pagerFor()} collabs={collabs} /> : null}
      {packing ? <PackingSlide b={packing} pager={pagerFor()} collabs={collabs} /> : null}
      {faq ? <FaqSlide b={faq} pager={pagerFor()} collabs={collabs} /> : null}
      {closing ? <ClosingSlide b={closing} cupo={cupo} collabs={collabs} /> : null}
    </div>
  );
}
