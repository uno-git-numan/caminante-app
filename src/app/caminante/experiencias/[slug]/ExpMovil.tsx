// Vista MÓVIL de la página de experiencia — transcripción de `PubExp`
// (design/publico-movil/pub-a.jsx:141) contra los datos reales.
//
// La ruta YA tiene escritorio (ExperienceTemplateV2, diseño v2 en producción):
// por eso `page.tsx` renderiza los DOS marcados y el CSS decide cuál se ve
// (corte en 700px). Aquí solo vive el móvil.
//
// De dónde sale cada cosa:
//   · hero / experiencia / itinerario / inversión / statement / incluye /
//     mochila / preguntas  → `Experience.page.blocks` (los bloques v2).
//   · niveles de precio     → `Experience.priceTiers`.
//   · ficha científica      → `Experience.ficha`.
//   · fechas                → `fetchOpenSlotsForTemplate` (respeta `?grupo=`).
//   · chip del operador     → `fetchOperatorChipForExperience`.
//   · estrellas             → `fetchExperienceRatings`.
//
// Lo que el mockup INVENTA y aquí NO se inventa:
//   · `e.guia = {n, r, q}` — no existe modelo de guía con cita (la heurística
//     `guias()` del Kit ya confundió variedades de hongo con personas). El
//     bloque `.pub-guide` se OMITE; el split real «Quién te guía» sí se
//     renderiza con su texto y su foto, que son dato de verdad.
//   · `e.cat` — no hay campo de categoría. El eyebrow del hero ya trae el
//     rótulo real ("Recolección de hongos · Edo. de México").
//   · Formas que no calzan: `incluye[]`/`packing[]` del mockup llevan segunda
//     línea; `V2Checklist.yesItems` y `V2Packing.items` son `string[]`, así que
//     van a una sola línea. La segunda línea sí se usa donde el dato real la
//     tiene (`V2Split.items[].role`, glosario, temporada).
//   · `ficha.especies[i]` del mockup era un texto + una fuente; el real es
//     `datos: {texto, fuente}[]` — se listan todos, cada uno con su fuente.

import { Fragment, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Estrellas, Eyeb, Sec } from "@/app/caminante/ui/pub/atoms";
import { ExpChrome, ExpHead } from "./ExpMovilChrome";
import type {
  Experience,
  V2Checklist,
  V2Dates,
  V2Faq,
  V2Hero,
  V2Image,
  V2Itinerary,
  V2Packing,
  V2Split,
  V2Statement,
  V2Tariff,
} from "@/lib/experiences/types";
import type { SlotAvailabilityPublic } from "@/lib/experiences/availability";
import type { OperatorChip } from "@/lib/operators/public";
import type { ExperienceRating } from "@/lib/experiences/card";

// --- markup inline del contenido v2: **negrita** y *itálica* ---
// (misma regla que `renderInline` de ExperienceTemplateV2, que no se exporta y
// que es producción intocable — se copia, no se refactoriza.)
function inline(text: string): ReactNode {
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

// Los montos de la base ya vienen en formato es-MX ("$2,550"). Solo los
// `priceTiers` guardan dígitos pelones.
function money(a: string): string {
  const digits = a.replace(/[^\d]/g, "");
  if (!digits) return a;
  return "$" + Number(digits).toLocaleString("es-MX");
}

const fmtDia = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric" });
const fmtMes = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", month: "short" });
const parte = (f: Intl.DateTimeFormat, iso: string | null) =>
  iso ? f.format(new Date(iso)).replace(/\.$/, "") : "";

/** El rótulo de la salida; si la salida no tiene label, su fecha. */
function etiqueta(s: SlotAvailabilityPublic): string {
  if (s.label?.trim()) return s.label;
  const d = parte(fmtDia, s.startsAt);
  const m = parte(fmtMes, s.startsAt);
  return d && m ? `${d} ${m}` : "Salida abierta";
}

function disponibilidad(s: SlotAvailabilityPublic): string {
  if (s.soldOut) return "agotada";
  if (s.available === null) return "lugares disponibles";
  if (s.available === 1) return "queda 1 lugar";
  return `quedan ${s.available}`;
}

function imgStyle(im: V2Image): CSSProperties | undefined {
  return im.pos ? { objectPosition: im.pos } : undefined;
}

// --- átomos locales (los del entregable que no viven en ui/pub/atoms) ---

const H2 = ({ t, ac }: { t: string; ac?: string }) => (
  <h2>
    {t}
    {ac ? (
      <>
        {" "}
        <em>{ac}</em>
      </>
    ) : null}
  </h2>
);

/** Sección desplegable — `Secd` de pub-a.jsx:140. */
function Secd({
  sx,
  t,
  title,
  open,
  children,
}: {
  sx: number;
  t: string;
  title?: ReactNode;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="pub-secd" data-sx={String(sx)} open={open}>
      <summary>
        <span className="sy">
          <Eyeb>{t}</Eyeb>
          {title}
        </span>
        <span className="chev">⌄</span>
      </summary>
      <div className="bd">{children}</div>
    </details>
  );
}

/** Foto redondeada dentro de una sección (mockup: los bloques de foto de PubExp). */
function Foto({ im, h = 190 }: { im?: V2Image; h?: number }) {
  if (!im?.url) return null;
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", marginTop: 16, height: h, boxShadow: "var(--shadow)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={im.url} alt={im.alt || ""} style={imgStyle(im)} />
    </div>
  );
}

/** Fila de lista `//  texto \n subtexto` (`.pub-inc`). */
function Filas({ children }: { children: ReactNode }) {
  return (
    <div className="pub-inc" style={{ marginTop: 0, borderTop: 0 }}>
      {children}
    </div>
  );
}
function Fila({ mk = "//", t, s }: { mk?: string; t: string; s?: string }) {
  return (
    <div className="row">
      <span className="sl">{mk}</span>
      <span>
        {t}
        {s ? <small>{s}</small> : null}
      </span>
    </div>
  );
}

// --- el cuerpo de un bloque `split` (experiencia, guía, comunidad, variedades) ---
function CuerpoSplit({ b }: { b: V2Split }) {
  return (
    <>
      {b.subEyebrow ? (
        <p style={{ color: "var(--orange)", fontSize: 14.5 }}>{b.subEyebrow}</p>
      ) : null}
      {b.paragraphs?.map((p, i) => <p key={i}>{inline(p)}</p>)}
      {b.points?.length ? (
        <div style={{ marginTop: 14 }}>
          <Filas>
            {b.points.map((p, i) => (
              <Fila key={i} t={p} />
            ))}
          </Filas>
        </div>
      ) : null}
      {b.items?.length ? (
        <div style={{ marginTop: 14 }}>
          <Filas>
            {b.items.map((it, i) => (
              <Fila key={i} t={it.name} s={it.role} />
            ))}
          </Filas>
        </div>
      ) : null}
      {b.lead ? (
        <p style={{ marginTop: 12, color: "var(--ink-soft)", fontSize: 14.5 }}>{inline(b.lead)}</p>
      ) : null}
      <Foto im={b.media?.images?.[0]} />
    </>
  );
}

type Seccion = { label: string; nodo: (sx: number) => ReactNode };

export default function ExpMovil({
  experience,
  slots,
  grupoToken,
  operatorChip,
  rating,
}: {
  experience: Experience;
  slots: SlotAvailabilityPublic[];
  grupoToken?: string | null;
  operatorChip?: OperatorChip | null;
  rating?: ExperienceRating | null;
}) {
  const slug = experience.slug;
  const q = grupoToken ? `?grupo=${grupoToken}` : "";
  const blocks = experience.page?.blocks ?? [];

  const hero = blocks.find((b) => b.type === "hero") as V2Hero | undefined;
  const splits = blocks.filter((b) => b.type === "split") as V2Split[];
  const itin = blocks.find((b) => b.type === "itinerary") as V2Itinerary | undefined;
  const tariff = blocks.find((b) => b.type === "tariff") as V2Tariff | undefined;
  const statement = blocks.find((b) => b.type === "statement") as V2Statement | undefined;
  const checklist = blocks.find((b) => b.type === "checklist") as V2Checklist | undefined;
  const packing = blocks.find((b) => b.type === "packing") as V2Packing | undefined;
  const faq = blocks.find((b) => b.type === "faq") as V2Faq | undefined;
  const dates = blocks.find((b) => b.type === "dates") as V2Dates | undefined;

  // El primer split es «La experiencia» (lleva `anchor:"experiencia"`); los
  // demás (guía, comunidad, variedades) van después del bloque «incluye»,
  // como en el orden canónico de la página.
  const expSplit = splits.find((b) => b.anchor === "experiencia") ?? splits[0];
  const otrosSplits = splits.filter((b) => b !== expSplit);

  const ficha = experience.ficha;
  const especies = ficha?.especies?.filter((e) => e.comun?.trim()) ?? [];
  const glosario = ficha?.glosario?.filter((g) => g.termino?.trim()) ?? [];
  const temporada = ficha?.temporada?.filter((t) => t.epoca?.trim() || t.fenomeno?.trim()) ?? [];
  const hayFicha = especies.length > 0 || glosario.length > 0 || temporada.length > 0;

  const tiers = (experience.priceTiers ?? []).filter((t) => t.label?.trim() && t.amount?.trim());
  const montoTiers = tiers
    .map((t) => Number(t.amount.replace(/[^\d]/g, "")))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];
  // Precio de la barra de compra: nivel más barato → tarifa del bloque →
  // precio base. Nunca se reformatea un monto que ya viene formateado.
  const precioBarra = montoTiers
    ? `desde ${money(String(montoTiers))}`
    : tariff?.price?.trim()
      ? `desde ${tariff.price}`
      : experience.price?.amount?.trim()
        ? `desde ${money(experience.price.amount)}`
        : "por anunciar";

  const s0 = slots[0];
  const hayFechas = slots.length > 0;
  const buy = {
    precio: precioBarra,
    sub: s0 ? `por persona · ${etiqueta(s0)}` : "puedes solicitar tu fecha",
    href: hayFechas ? `/caminante/reservar/${slug}${q}` : `/caminante/solicitar/${slug}`,
    cta: hayFechas ? "Reservar" : "Solicitar grupo",
  };

  const secciones: Seccion[] = [];

  if (expSplit) {
    secciones.push({
      label: expSplit.eyebrow,
      nodo: (sx) => (
        <Secd sx={sx} t={expSplit.eyebrow} title={<H2 t={expSplit.title} ac={expSplit.titleAccent} />} open>
          <CuerpoSplit b={expSplit} />
        </Secd>
      ),
    });
  }

  if (itin) {
    secciones.push({
      label: itin.eyebrow,
      nodo: (sx) => (
        <Secd sx={sx} t={itin.eyebrow} title={<H2 t={itin.title} ac={itin.titleAccent} />}>
          <div className="pub-it">
            {itin.days.map((d, i) => (
              <div className={"step" + (i === 0 ? " hi" : "")} key={i}>
                <span className="h">{d.num ? `${d.num} · ${d.lab}` : d.lab}</span>
                {d.ttl ? <b>{d.ttl}</b> : null}
                {d.items.map((li, j) => (
                  <p key={j} style={j ? { marginTop: 3 } : undefined}>
                    {inline(li)}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Secd>
      ),
    });
  }

  if (tariff) {
    secciones.push({
      label: tariff.eyebrow,
      nodo: (sx) => (
        <Secd sx={sx} t={tariff.eyebrow} title={<H2 t={tariff.title} ac={tariff.titleAccent} />}>
          {tiers.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tiers.map((t) => (
                <div className="pub-fecha" key={t.label}>
                  <div className="g">
                    <b>{t.label}</b>
                    <small>Por persona</small>
                  </div>
                  <span className="disp pub-mono" style={{ fontSize: 16 }}>
                    {money(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <h2 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 200 }}>
              {tariff.price} {tariff.priceCur ? <em>{tariff.priceCur}</em> : null}
            </h2>
          )}
          {tariff.lead ? <p style={{ marginTop: 12 }}>{tariff.lead}</p> : null}
          {tariff.tier || tariff.availK || tariff.availV ? (
            <div style={{ marginTop: 14 }}>
              <Filas>
                {tariff.tier ? <Fila t={tariff.tier} /> : null}
                {tariff.availK || tariff.availV ? (
                  <Fila t={tariff.availK || ""} s={tariff.availV} />
                ) : null}
              </Filas>
            </div>
          ) : null}
        </Secd>
      ),
    });
  }

  if (checklist) {
    secciones.push({
      label: checklist.eyebrow,
      nodo: (sx) => (
        <Secd sx={sx} t={checklist.eyebrow} title={<H2 t={checklist.title} ac={checklist.titleAccent} />}>
          {checklist.yesItems?.length ? (
            <>
              <span className="pub-lbl">{checklist.yesTitle}</span>
              <Filas>
                {checklist.yesItems.map((it, i) => (
                  <Fila key={i} t={it} />
                ))}
              </Filas>
            </>
          ) : null}
          {checklist.noItems?.length ? (
            <div style={{ marginTop: 20 }}>
              <span className="pub-lbl">{checklist.noTitle}</span>
              <Filas>
                {checklist.noItems.map((it, i) => (
                  <Fila key={i} mk={checklist.noMark || "−"} t={it} />
                ))}
              </Filas>
            </div>
          ) : null}
        </Secd>
      ),
    });
  }

  for (const sp of otrosSplits) {
    secciones.push({
      label: sp.eyebrow,
      nodo: (sx) => (
        <Secd sx={sx} t={sp.eyebrow} title={<H2 t={sp.title} ac={sp.titleAccent} />}>
          <CuerpoSplit b={sp} />
        </Secd>
      ),
    });
  }

  if (hayFicha) {
    secciones.push({
      label: "Ficha científica",
      nodo: (sx) => (
        <Secd sx={sx} t="Ficha científica" title={<H2 t="Lo que vas a" ac="encontrar." />}>
          <p>Cada dato lleva su fuente — sin fuente, el dato no entra. Es la regla de la casa.</p>
          {especies.length ? (
            <div className="pub-ficha">
              {especies.map((sp, i) => (
                <details key={i} open={i === 0}>
                  <summary>
                    <b>
                      {sp.comun}
                      {sp.cientifico ? <i>{sp.cientifico}</i> : null}
                    </b>
                    <span className="x">+</span>
                  </summary>
                  <div className="body">
                    {(sp.datos ?? []).map((d, j) => (
                      <Fragment key={j}>
                        {j ? <br /> : null}
                        {d.texto}
                        <span className="pub-fuente">Fuente · {d.fuente}</span>
                      </Fragment>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : null}
          {glosario.length ? (
            <div style={{ marginTop: 18 }}>
              <span className="pub-lbl">Glosario</span>
              <Filas>
                {glosario.map((g, i) => (
                  <Fila key={i} t={g.termino} s={g.def} />
                ))}
              </Filas>
            </div>
          ) : null}
          {temporada.length ? (
            <div style={{ marginTop: 18 }}>
              <span className="pub-lbl">Temporada</span>
              <Filas>
                {temporada.map((t, i) => (
                  <Fila key={i} t={t.epoca} s={t.fenomeno} />
                ))}
              </Filas>
            </div>
          ) : null}
        </Secd>
      ),
    });
  }

  if (packing?.items?.length) {
    secciones.push({
      label: packing.eyebrow,
      nodo: (sx) => (
        <Secd sx={sx} t={packing.eyebrow} title={<H2 t={packing.title} ac={packing.titleAccent} />}>
          {packing.cap ? <p>{packing.cap}</p> : null}
          <div style={{ marginTop: 14 }}>
            <Filas>
              {packing.items.map((it, i) => (
                <Fila key={i} t={it} />
              ))}
            </Filas>
          </div>
          <Foto im={packing.photo} h={170} />
        </Secd>
      ),
    });
  }

  if (faq?.qa?.length) {
    secciones.push({
      label: faq.eyebrow,
      nodo: (sx) => (
        <Secd sx={sx} t={faq.eyebrow} title={<H2 t="Antes de" ac="preguntar." />}>
          <div className="pub-faq">
            {faq.qa.map((x, i) => (
              <details key={i} open={i === 0}>
                <summary>
                  {x.q}
                  <span className="x">+</span>
                </summary>
                <div className="a">{x.a}</div>
              </details>
            ))}
          </div>
        </Secd>
      ),
    });
  }

  const opName = operatorChip?.name;
  secciones.push({
    label: dates?.eyebrow || "Próximas fechas",
    nodo: (sx) => (
      <Secd
        sx={sx}
        t={dates?.eyebrow || "Próximas fechas"}
        title={<H2 t={dates?.title || "Elige tu"} ac={dates?.titleAccent || "salida."} />}
        open
      >
        {dates?.cap ? <p>{dates.cap}</p> : null}
        {!hayFechas ? (
          <div className="pub-blk" style={{ marginTop: 14 }}>
            <div className="pub-state" style={{ padding: "10px 0 4px" }}>
              <h3>No hay fechas abiertas</h3>
              <p>
                Puedes pedir la tuya
                {experience.minPeople
                  ? `: con ${experience.minPeople} personas o más se abre una salida privada`
                  : ""}
                .
              </p>
              <Link
                className="pub-cta pub-cta-orange"
                style={{ width: "auto", padding: "0 24px" }}
                href={`/caminante/solicitar/${slug}`}
              >
                Solicitar mi fecha
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {slots.map((s) => (
              <div className={"pub-fecha" + (s.soldOut ? " off" : "")} key={s.id}>
                {s.startsAt ? (
                  <div className="d">
                    <b>{parte(fmtDia, s.startsAt)}</b>
                    <small>{parte(fmtMes, s.startsAt)}</small>
                  </div>
                ) : null}
                <div className="g">
                  <b>{etiqueta(s)}</b>
                  {opName ? <small>Operada por {opName}</small> : null}
                  <span
                    className={
                      "disp" + (s.soldOut || (s.available !== null && s.available <= 3) ? " low" : "")
                    }
                    style={{ display: "block", marginTop: 3 }}
                  >
                    {disponibilidad(s)}
                  </span>
                </div>
                {s.soldOut ? null : (
                  <Link
                    className="pub-cta pub-cta-orange pub-cta-sm"
                    style={{ width: "auto", flex: "0 0 auto" }}
                    href={`/caminante/reservar/${slug}${q}`}
                  >
                    Reservar
                  </Link>
                )}
              </div>
            ))}
            <Link className="pub-cta pub-cta-ghost pub-cta-sm" href={`/caminante/solicitar/${slug}`}>
              ¿Ninguna te sirve? Solicita tu fecha
            </Link>
          </div>
        )}
      </Secd>
    ),
  });

  // El statement no es una sección del riel (en el mockup tampoco): va suelto
  // después de «la inversión» (o de la primera sección si no hay tarifa).
  const iStatement = tariff
    ? Math.max(secciones.findIndex((s) => s.label === tariff.eyebrow), 0)
    : 0;

  const metaHero = [s0 ? etiqueta(s0) : "", hero?.metaEst].filter(Boolean).join(" · ");

  return (
    <div className="pub-screen">
      <ExpHead />

      {hero ? (
        <div className="pub-hero">
          {hero.bg?.url ? (
            <div className="ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.bg.url} alt={hero.bg.alt || ""} style={imgStyle(hero.bg)} />
            </div>
          ) : null}
          <div className="veil" />
          <div className="inner" style={{ paddingBottom: 22 }}>
            <Eyeb neg>{hero.eyebrow}</Eyeb>
            <h1>
              {hero.title}
              {hero.titleAccent ? (
                <>
                  {" "}
                  <em>{hero.titleAccent}</em>
                </>
              ) : null}
            </h1>
            {hero.sub ? <p>{hero.sub}</p> : null}
            {metaHero ? <span className="meta">{metaHero}</span> : null}
            {operatorChip ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="pub-chip" href={`/caminante/operador/${operatorChip.slug}`}>
                  Operada por {operatorChip.name} →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* La calificación va FUERA del hero, sobre crema: en naranja encima de la
          foto se pierde (Luis, 11 ago). Mismo tratamiento que el escritorio. */}
      {rating ? (
        <div style={{ padding: "14px 22px 0" }}>
          <Estrellas stars={rating.stars} count={rating.count} />
        </div>
      ) : null}

      {secciones.map((s, i) => (
        <Fragment key={i}>
          {s.nodo(i)}
          {i === iStatement && statement ? (
            <Sec>
              <Eyeb>
                {statement.eyebrowPre ? `${statement.eyebrowPre} · ${statement.eyebrow}` : statement.eyebrow}
              </Eyeb>
              <H2 t={statement.title} ac={statement.titleAccent} />
              {statement.body ? <p>{statement.body}</p> : null}
              {statement.quote ? (
                <h2 style={{ fontSize: 24 }}>
                  <em>{statement.quote}</em>
                </h2>
              ) : null}
            </Sec>
          ) : null}
        </Fragment>
      ))}

      <ExpChrome secs={secciones.map((s) => s.label)} buy={buy} />
    </div>
  );
}
