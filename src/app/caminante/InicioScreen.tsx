"use client";

// La portada móvil — transcrita de `PubInicio` (design/publico-movil/pub-a.jsx).
// Marcado y clases VERBATIM del entregable; los datos los arma `page.tsx`
// (server) y bajan por props. Es cliente porque el hero scrollea el contenedor
// del shell y la hoja «Avísame» vive en `usePubUI()`.
//
// Cambios respecto al mockup, cada uno con su motivo:
//   · `nav.push("exp"|"destino"|"operador"|"nosotros")` → <Link href> reales.
//   · Los `<Ph cat=… />` (rectángulos de color) → fotos REALES del banco o del
//     destino. Sin foto, el bloque se queda sin ella; nunca se rellena con una
//     foto que no es del lugar.
//   · `op.marca = {fondo, acento}` (los colores de Kéntro) NO existe: es el plan
//     white-label, sin construir. El cuadro del operador lleva su foto si la
//     tiene y, si no, el sello de Caminante — como el default del entregable.
//   · «4,8 de 5 · Ensenada de Muertos · 12 respuestas» estaba HARDCODEADO. Aquí
//     sale de `fetchExperienceRatings`, por EXPERIENCIA (decisión de Luis, 11
//     ago), y si no hay encuestas la línea no se pinta.

import Link from "next/link";
import type { MouseEvent } from "react";
import { usePubUI } from "./ui/pub/PubShell";
import { Eyeb, HeadFloat, Sec, Testi } from "./ui/pub/atoms";
import type { DestinoCard } from "@/lib/destinos/queries";
import type { OperadorCard } from "@/lib/operators/public";

/** Una salida próxima, ya formateada en el servidor (fechas en CDMX). */
export type SalidaVM = {
  id: string;
  slug: string; // → /caminante/experiencias/<slug>
  dia: string; // "26"
  mes: string; // "AGO"
  nombre: string;
  lugar: string;
  label: string;
  disp: string; // "quedan 4" · "agotada" · "abierta"
  low: boolean; // quedan 3 o menos
};

export type CalificacionVM = {
  estrellas: string; // "4,6"
  experiencia: string;
  respuestas: number;
};

export type TestimonioVM = { texto: string; firma: string };

/** El scroll suave del entregable (pub-core.jsx), sobre `.pub-scroll`. */
function scrollSuave(cont: Element, top: number) {
  const antes = cont.scrollTop;
  try {
    cont.scrollTo({ top, behavior: "smooth" });
  } catch {
    cont.scrollTop = top;
  }
  setTimeout(() => {
    if (Math.abs(cont.scrollTop - antes) < 2 && Math.abs(top - antes) > 2) cont.scrollTop = top;
  }, 160);
}

function irA(ev: MouseEvent<HTMLButtonElement>, id: string) {
  const cont = ev.currentTarget.closest(".pub-scroll");
  const el = cont?.querySelector<HTMLElement>(id);
  if (cont && el) scrollSuave(cont, el.offsetTop - 56);
}

/** Foto real. Sin `src` el hueco se queda vacío (regla del PATRÓN). */
function Foto({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <div className="ph">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </div>
  );
}

export default function InicioScreen({
  heroFoto,
  nosotrosFoto,
  salidas,
  lugares,
  operadores,
  testimonios,
  calificacion,
  solicitarSlug,
}: {
  heroFoto: string;
  nosotrosFoto: string;
  salidas: SalidaVM[];
  lugares: DestinoCard[];
  operadores: OperadorCard[];
  testimonios: TestimonioVM[];
  calificacion: CalificacionVM | null;
  solicitarSlug: string | null;
}) {
  const ui = usePubUI();

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <HeadFloat onMenu={() => ui.abrirHoja("menu")} />

      {/* 1 · Bienvenida — breve, orienta */}
      <div className="pub-hero" style={{ minHeight: 520 }}>
        <Foto src={heroFoto} alt="Bosque de pino entre niebla" />
        <div className="veil"></div>
        <div className="inner" style={{ paddingBottom: 22 }}>
          <Eyeb neg>Ciencia real · naturaleza real</Eyeb>
          <h1 style={{ fontSize: 34 }}>
            Bienvenido a <em>Caminante.</em>
          </h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="pub-cta"
              style={{
                background: "var(--olive)",
                color: "#fff",
                flex: 1,
                fontSize: 14.5,
                minHeight: 50,
                padding: "0 10px",
              }}
              onClick={(ev) => irA(ev, "#ini-lugares")}
            >
              Ver dónde caminamos →
            </button>
            <button
              className="pub-cta pub-cta-glass"
              style={{ flex: 1, fontSize: 14.5, minHeight: 50, padding: "0 10px" }}
              onClick={(ev) => irA(ev, "#ini-salidas")}
            >
              Ver próximas experiencias →
            </button>
          </div>
        </div>
      </div>

      {/* Qué es Caminante — bajo el hero */}
      <Sec style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 15.5 }}>
          Llevamos gente a caminar por lugares reales de México — un bosque de hongos, el mar de
          Cortés, las Barrancas del Cobre — con ciencia real, guías que llevan años leyendo cada
          lugar y derrama directa en sus comunidades.
        </p>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 10 }}>
          Aquí encuentras las próximas salidas, los lugares y lo que sabemos de cada uno.
        </p>
      </Sec>

      {/* 2 · Próximas salidas */}
      <Sec id="ini-salidas">
        <Eyeb>Próximas salidas</Eyeb>
        <h2>
          Cuándo <em>salimos.</em>
        </h2>
      </Sec>
      {salidas.length === 0 ? (
        <div style={{ padding: "0 20px" }}>
          <div className="pub-blk">
            <div className="pub-state" style={{ padding: "8px 0" }}>
              <h3>Sin salidas abiertas hoy</h3>
              <p>
                Las fechas nuevas se anuncian primero por correo. O pide la tuya: escríbenos y la
                abrimos.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="pub-cta pub-cta-orange pub-cta-sm"
                  onClick={() => ui.abrirHoja("avisame", { exp: "las próximas salidas" })}
                >
                  Avísame
                </button>
                {solicitarSlug ? (
                  <Link
                    className="pub-cta pub-cta-ghost pub-cta-sm"
                    href={`/caminante/solicitar/${solicitarSlug}`}
                  >
                    Solicitar fecha
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
          {salidas.map((s) => (
            <Link className="pub-fecha" key={s.id} href={`/caminante/experiencias/${s.slug}`}>
              <div className="d">
                <b>{s.dia}</b>
                <small>{s.mes}</small>
              </div>
              <div className="g">
                <b>{s.nombre}</b>
                <small>
                  {s.lugar}
                  {s.lugar && s.label ? " · " : ""}
                  {s.label}
                </small>
              </div>
              <span className={"disp" + (s.low ? " low" : "")}>{s.disp}</span>
            </Link>
          ))}
          <Link className="pub-cta pub-cta-ghost pub-cta-sm" href="/caminante/calendario">
            Ver el calendario completo
          </Link>
        </div>
      )}

      {/* 3 · Lugares — el corazón del inicio */}
      {lugares.length > 0 ? (
        <>
          <Sec id="ini-lugares">
            <Eyeb>Lugares</Eyeb>
            <h2>
              Dónde <em>caminamos.</em>
            </h2>
          </Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 20px" }}>
            {lugares.map((l) => (
              <Link
                key={l.slug}
                className="pub-expcard"
                style={{ minHeight: 210 }}
                href={`/caminante/destinos/${l.slug}`}
              >
                <Foto src={l.imageUrl} alt={l.estado} />
                <div className="veil"></div>
                <div className="inner">
                  <span className="date">{l.estado}</span>
                  <h3>
                    {l.titulo} {l.acento ? <em>{l.acento}</em> : null}
                  </h3>
                  <div className="row">
                    <span className="pub-chip">
                      {l.coord ||
                        (l.experiencias === 1 ? "1 experiencia" : l.experiencias + " experiencias")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {/* 4 · Operadores */}
      {operadores.length > 0 ? (
        <>
          <Sec>
            <Eyeb>Operadores</Eyeb>
            <h2>
              Quién opera <em>cada salida.</em>
            </h2>
          </Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px" }}>
            {operadores.map((op) => (
              <Link
                key={op.slug}
                className="pub-blk"
                style={{ display: "flex", gap: 14, alignItems: "center", textAlign: "left" }}
                href={`/caminante/operador/${op.slug}`}
              >
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "var(--forest)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                    padding: op.photoUrl ? 0 : 8,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={op.photoUrl || "/email/caminante-mark-crema.png"}
                    alt={op.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: op.photoUrl ? "cover" : "contain",
                    }}
                  />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 15.5, display: "block" }}>{op.name}</b>
                  <small
                    style={{
                      fontSize: 13.5,
                      color: "var(--ink-soft)",
                      lineHeight: 1.5,
                      display: "block",
                      marginTop: 3,
                    }}
                  >
                    {op.bio ||
                      (op.experiencias === 1
                        ? "Opera 1 experiencia en la plataforma"
                        : `Opera ${op.experiencias} experiencias en la plataforma`)}
                  </small>
                </span>
                <span style={{ color: "var(--sand)", fontSize: 17 }}>›</span>
              </Link>
            ))}
            <Link className="pub-cta pub-cta-ghost pub-cta-sm" href="/caminante/embajadores">
              ¿Operas experiencias? Camina con nosotros →
            </Link>
          </div>
        </>
      ) : null}

      {/* 5 · Testimonios — textuales, con la calificación real */}
      <Sec>
        <Eyeb>Lo que dicen</Eyeb>
        <h2>
          Al volver<em>.</em>
        </h2>
        {calificacion ? (
          <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
            <span className="pub-mono" style={{ color: "var(--charcoal)", fontWeight: 600 }}>
              {calificacion.estrellas} de 5
            </span>{" "}
            · {calificacion.experiencia} ·{" "}
            {calificacion.respuestas === 1
              ? "1 respuesta"
              : `${calificacion.respuestas} respuestas`}
          </p>
        ) : null}
      </Sec>
      <div style={{ padding: "0 20px" }}>
        {testimonios.length ? (
          testimonios.map((t, i) => <Testi texto={t.texto} firma={t.firma} key={i} />)
        ) : (
          <div className="pub-blk">
            <div className="pub-state" style={{ padding: "6px 0" }}>
              <h3>Todavía sin reseñas</h3>
              <p>
                Las primeras llegan después de la primera salida — y se publican solo con
                consentimiento.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6 · Nosotros — la puerta, no el manifiesto */}
      <Sec style={{ paddingBottom: 26 }}>
        <Link className="pub-expcard" style={{ minHeight: 210 }} href="/caminante/nosotros">
          <Foto src={nosotrosFoto} alt="El bosque de niebla" />
          <div className="veil"></div>
          <div className="inner">
            <Eyeb neg>Nosotros</Eyeb>
            <h3>
              Por qué <em>caminamos.</em>
            </h3>
            <div className="row">
              <span className="pub-chip">el método, los pilares, la conservación →</span>
            </div>
          </div>
        </Link>
      </Sec>
    </div>
  );
}
