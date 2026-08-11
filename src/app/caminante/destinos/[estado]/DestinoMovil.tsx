"use client";

// Vista MÓVIL de la página de destino — transcripción de `PubDestino`
// (design/publico-movil/pub-a.jsx:252) contra los datos reales.
//
// La ruta YA tiene escritorio (`DestinoTemplate`, CSS `.dst`): `page.tsx`
// renderiza los DOS marcados y el CSS decide cuál se ve (corte en 700px, modo
// `swap`). Aquí solo vive el móvil; el escritorio no se toca.
//
// De dónde sale cada cosa:
//   · hero / territorio / caras / galería / cierre → `fetchDestino(slug)` →
//     `DestinoContent` (tabla `destinos`, 0023).
//   · la grilla de experiencias del estado → `fetchPublishedExperienceRows` +
//     `toCard` + `fetchPublicAvailability`, filtrando por `data.estado`.
//
// ⚠️ El FALLBACK es la regla de esta pantalla: un estado sin fila en `destinos`
// tiene que renderizar una página VÁLIDA, nunca un 404. Por eso cada sección
// editorial es condicional y, sin foto de portada, el hero oscuro se cambia por
// una cabecera crema — un `.pub-hero` sin `.ph` sería texto blanco con velo
// oscuro encima del crema, ilegible.
//
// Lo que el mockup inventa y aquí NO se inventa:
//   · `l.temporadas` («cuándo suele haber salida») — `DestinoContent` no tiene
//     ese campo. `Experience.ficha.temporada` existe pero es por experiencia, no
//     por destino. El bloque vacío queda solo con «Avísame» y «Solicitar fecha».
//   · «Aprende aquí» (`CAPS`) — no hay tabla de cápsulas (barrido 0001–0034).
//     La sección se omite entera; no se fabrican artículos.

import Link from "next/link";
import type { MouseEvent } from "react";
import { pfmt, usePubUI } from "@/app/caminante/ui/pub/PubShell";
import { Eyeb, HeadFloat, Sec } from "@/app/caminante/ui/pub/atoms";
import type { DestinoContent } from "@/lib/destinos/types";

export type ExpDestino = {
  slug: string;
  titulo: string;
  acento: string;
  hook: string;
  imagen: string;
  imagenAlt: string;
  /** Precio base en MXN (mismo parser que cobra) o null si no hay. */
  precio: number | null;
  operador: string | null;
  /** Salidas abiertas, ya formateadas por el servidor. */
  salidas: { label: string; dispo: string }[];
};

/** Foto de un bloque. Sin URL el hueco se queda vacío — jamás se rellena con
 *  una foto que no es del lugar (regla del PATRÓN). */
function Foto({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <div className="ph">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </div>
  );
}

export default function DestinoMovil({
  estado,
  content,
  exps,
}: {
  estado: string;
  content: DestinoContent | null;
  exps: ExpDestino[];
}) {
  const ui = usePubUI();
  const c = content ?? {};

  const heroTitle = c.heroTitle || estado;
  const conFecha = exps.some((e) => e.salidas.length > 0);
  const nConFecha = exps.filter((e) => e.salidas.length > 0).length;

  const hayTerr = Boolean(c.terrIntro?.length || c.terrPills?.length);
  const hayCaras = Boolean(c.caras?.length);
  const hayGaleria = Boolean(c.gallery?.length);

  // El botón «Ver experiencias» del hero: baja a la grilla. El scroll de esta
  // app no es el de la ventana sino el de `.pub-scroll` (ver PubShell), así que
  // un ancla no basta.
  const irExps = (ev: MouseEvent<HTMLButtonElement>) => {
    const cont = ev.currentTarget.closest(".pub-scroll");
    const el = cont?.querySelector<HTMLElement>("#lug-exps");
    if (cont && el) cont.scrollTo({ top: Math.max(el.offsetTop - 64, 0), behavior: "smooth" });
  };

  const verExps = (
    <button
      className={"pub-cta " + (nConFecha > 0 ? "pub-cta-orange" : "pub-cta-glass")}
      onClick={irExps}
    >
      {nConFecha > 0
        ? `Ver experiencias · ${nConFecha} →`
        : exps.length > 0
          ? `Ver experiencias · ${exps.length} →`
          : "Ver qué se puede vivir aquí →"}
    </button>
  );

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <HeadFloat
        back
        backHref="/caminante/experiencias"
        oncream={!c.heroBgUrl}
        onMenu={() => ui.abrirHoja("menu")}
      />

      {c.heroBgUrl ? (
        <div className="pub-hero" style={{ minHeight: 440 }}>
          <Foto src={c.heroBgUrl} alt={`Paisaje de ${estado}`} />
          <div className="veil" />
          <div className="inner" style={{ paddingBottom: 24 }}>
            <Eyeb neg>{estado}</Eyeb>
            <h1 style={{ fontSize: 36 }}>
              {heroTitle} {c.heroAccent ? <em>{c.heroAccent}</em> : null}
            </h1>
            {c.heroSub ? <p>{c.heroSub}</p> : null}
            {c.heroMeta ? <span className="meta">{c.heroMeta}</span> : null}
            {verExps}
          </div>
        </div>
      ) : (
        // Fallback sin portada: cabecera crema. El estado sigue teniendo página.
        <>
          <div className="pub-headpad"></div>
          <Sec style={{ paddingTop: 10 }}>
            <Eyeb>Destino · {estado}</Eyeb>
            <h2>
              {heroTitle} {c.heroAccent ? <em>{c.heroAccent}</em> : null}
            </h2>
            {c.heroSub ? <p>{c.heroSub}</p> : null}
            {c.heroMeta ? (
              <p className="pub-mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                {c.heroMeta}
              </p>
            ) : null}
            <div style={{ marginTop: 14 }}>{verExps}</div>
          </Sec>
        </>
      )}

      {hayTerr ? (
        <Sec>
          <Eyeb>El territorio por dentro</Eyeb>
          {(c.terrIntro ?? []).map((p, i) => (
            <p key={i} style={{ marginTop: i ? 12 : 14 }}>
              {p}
            </p>
          ))}
          {c.terrPills?.length ? (
            <div className="pub-pild">
              {c.terrPills.map((p, i) => (
                <div className="pd" key={i}>
                  <b className="pub-mono">{p.v}</b>
                  <small>{p.k}</small>
                </div>
              ))}
            </div>
          ) : null}
        </Sec>
      ) : null}

      {/* Experiencias del lugar — lo primero accionable: donde se compra. */}
      <Sec id="lug-exps">
        <Eyeb>Experiencias</Eyeb>
        <h2 style={{ fontSize: 24 }}>
          {c.expTitle || "Vivir"} <em>{c.expAccent || `${estado}.`}</em>
        </h2>
        {c.expCap ? (
          <p style={{ fontSize: 14.5, color: "var(--ink-soft)", marginTop: 8 }}>{c.expCap}</p>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
          {exps.map((e) => (
            <Link
              className="pub-expcard"
              style={{ minHeight: 280 }}
              key={e.slug}
              href={`/caminante/experiencias/${e.slug}`}
            >
              <Foto src={e.imagen} alt={e.imagenAlt} />
              <div className="veil" />
              <div className="inner">
                {e.salidas[0] ? (
                  <span className="date">
                    Próxima · {e.salidas[0].label}
                    {e.salidas[0].dispo ? ` · ${e.salidas[0].dispo}` : ""}
                  </span>
                ) : null}
                <h3>
                  {e.titulo} {e.acento ? <em>{e.acento}</em> : null}
                </h3>
                {e.hook ? (
                  <p
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.5,
                      color: "rgba(255,255,255,.88)",
                      maxWidth: "32ch",
                    }}
                  >
                    {e.hook}
                  </p>
                ) : null}
                <div className="row">
                  {e.precio != null ? (
                    <span className="pub-chip">{pfmt(e.precio)} por persona</span>
                  ) : null}
                  {e.salidas[1] ? (
                    <span className="pub-chip">
                      {e.salidas[1].label}
                      {e.salidas[1].dispo ? ` · ${e.salidas[1].dispo}` : ""}
                    </span>
                  ) : null}
                  {e.operador ? <span className="pub-chip">Operada por {e.operador}</span> : null}
                  <span className="pub-chip solid">Ver experiencia →</span>
                </div>
              </div>
            </Link>
          ))}

          {!conFecha ? (
            <div className="pub-blk">
              <div className="pub-state" style={{ padding: "8px 0" }}>
                <h3>
                  {exps.length
                    ? "Sin fechas abiertas aquí"
                    : `Todavía no hay experiencias en ${estado}`}
                </h3>
                <p>
                  {exps.length
                    ? "Déjanos tu correo y te avisamos en cuanto abra una salida, o pide la tuya."
                    : "Estamos preparando las primeras travesías por este destino. Te avisamos cuando abran."}
                </p>
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <button
                    className="pub-cta pub-cta-orange pub-cta-sm"
                    style={{ flex: 1 }}
                    onClick={() => ui.abrirHoja("avisame", { exp: estado })}
                  >
                    Avísame
                  </button>
                  {exps[0] ? (
                    <Link
                      className="pub-cta pub-cta-ghost pub-cta-sm"
                      style={{ flex: 1 }}
                      href={`/caminante/solicitar/${exps[0].slug}`}
                    >
                      Solicitar fecha
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Sec>

      {hayCaras ? (
        <Sec>
          <Eyeb>Las cuatro caras</Eyeb>
          <h2>
            Un lugar se lee <em>por cuatro lados.</em>
          </h2>
          {c.carasCap ? <p>{c.carasCap}</p> : null}
          <div className="pub-ficha">
            {(c.caras ?? []).map((cara, i) => (
              <details key={i} open={i === 0}>
                <summary>
                  <b>
                    {cara.label}
                    {cara.title ? <i>{cara.title}</i> : null}
                  </b>
                  <span className="x">+</span>
                </summary>
                <div className="body">{cara.text}</div>
              </details>
            ))}
          </div>
        </Sec>
      ) : null}

      {hayGaleria ? (
        <Sec>
          <Eyeb>Galería</Eyeb>
          {c.galleryCap ? <p>{c.galleryCap}</p> : null}
          <div className="pub-gal">
            {(c.gallery ?? []).map((g, i) => (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.imageUrl} alt={g.caption || `${estado} ${i + 1}`} />
                {g.caption ? <figcaption>{g.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </Sec>
      ) : null}

      <Sec style={{ paddingBottom: 28 }}>
        {c.closeBgUrl ? (
          <div className="pub-expcard" style={{ minHeight: 200 }}>
            <Foto src={c.closeBgUrl} alt={`Paisaje de ${estado}`} />
            <div className="veil" />
            <div className="inner">
              <Eyeb neg>{c.closeEyebrow || `${estado} te espera`}</Eyeb>
              <h3>
                {c.closeTitle || "Nos vemos"} <em>{c.closeAccent || "allá."}</em>
              </h3>
            </div>
          </div>
        ) : (
          <>
            <Eyeb>{c.closeEyebrow || `${estado} te espera`}</Eyeb>
            <h2>
              {c.closeTitle || "Nos vemos"} <em>{c.closeAccent || "allá."}</em>
            </h2>
          </>
        )}
      </Sec>
    </div>
  );
}
