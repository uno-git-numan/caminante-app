"use client";

// Vista MÓVIL del perfil público de operador — transcripción de `PubOperador`
// (design/publico-movil/pub-a.jsx:358) contra los datos reales.
//
// La ruta YA tiene escritorio (`.opf`, diseño de Claude Design en producción):
// `page.tsx` renderiza los DOS marcados y el CSS decide cuál se ve (corte en
// 700px, modo `swap`). El escritorio no se tocó.
//
// Todo sale de `fetchOperatorProfile(slug)` · src/lib/operators/public.ts.
//
// ⚠️ El mockup enseña MENOS de lo que esa función ya devuelve: solo nombre,
// descripción y una lista de experiencias. Métricas, equipo y testimonios se
// perderían. En vez de omitirlos se acomodan en el lenguaje visual del
// entregable, sin inventar componentes nuevos:
//   · métricas → `.pub-pild` (la retícula de datos de PubDestino)
//   · equipo   → `.pub-guide` (la tarjeta de guía de PubExp)
//   · testimonios → `Testi` (`.pub-testi`)
//
// Reglas que manda el sistema y el diseño no conoce:
//   · Los testimonios se firman con INICIALES (`initialsOf`) y solo salen con
//     `publish_status='approved'` + `testimonial_consent=true`. El filtro vive
//     en `fetchOperatorProfile`; aquí solo se pinta lo que llega.
//   · Los colores de marca del operador (`op.marca = {fondo, acento}`) NO
//     existen: es el plan white-label, que no está construido. El perfil va con
//     los colores de Caminante.
//   · Una métrica sin dato no se pinta (nada de ceros de relleno).

import Link from "next/link";
import { usePubUI } from "@/app/caminante/ui/pub/PubShell";
import { Estrellas, Eyeb, HeadFloat, NavCream, Sec, Testi } from "@/app/caminante/ui/pub/atoms";
import { adjustStyle } from "@/lib/operators/photo-style";
import type { OperatorProfile } from "@/lib/operators/public";

/** "Numan · Caminante" → la última parte en acento naranja, como el escritorio. */
function tituloConAcento(name: string) {
  const parts = name.split(" · ");
  if (parts.length < 2) return <>{name}</>;
  return (
    <>
      {parts.slice(0, -1).join(" · ")} · <em>{parts[parts.length - 1]}</em>
    </>
  );
}

export default function OperadorMovil({
  op,
  desde,
  borrador = false,
}: {
  op: OperatorProfile;
  /** "agosto de 2026" — formateado en el servidor para no depender del locale. */
  desde: string;
  /** Vista previa de admin (?draft=1) de un perfil que aún NO es público. */
  borrador?: boolean;
}) {
  const ui = usePubUI();
  const m = op.metrics;
  const ig = op.instagram ? op.instagram.replace(/^@/, "") : null;

  // Solo las métricas con dato real (mismo criterio que el escritorio).
  const pild: { v: string; k: string }[] = [];
  if (m.salidas > 0)
    pild.push({ v: String(m.salidas), k: m.salidas === 1 ? "Salida operada" : "Salidas operadas" });
  if (m.viajeros > 0) pild.push({ v: String(m.viajeros), k: "Viajeros" });
  if (m.stars != null)
    pild.push({
      v: `${m.stars.toFixed(1).replace(".", ",")} ★`,
      k: `Satisfacción · ${m.encuestas} ${m.encuestas === 1 ? "respuesta" : "respuestas"}`,
    });
  if (m.volveria != null) pild.push({ v: `${m.volveria}%`, k: "Volvería a viajar" });

  const meta = `Opera desde ${desde}`;
  const equipo = op.team.filter((t) => t.name);

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      {borrador ? (
        <div
          style={{
            background: "var(--orange)",
            color: "#fff",
            textAlign: "center",
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Vista previa — este perfil aún NO es público.
        </div>
      ) : null}
      {op.heroPhotoUrl ? (
        <>
          <HeadFloat back backHref="/caminante/experiencias" onMenu={() => ui.abrirHoja("menu")} />
          <div className="pub-hero" style={{ minHeight: 420 }}>
            <div className="ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={op.heroPhotoUrl} alt="" style={adjustStyle(op.heroAdjust)} />
            </div>
            <div className="veil" />
            <div className="inner" style={{ paddingBottom: 24 }}>
              <Eyeb neg>Operador</Eyeb>
              <h1 style={{ fontSize: 36 }}>{tituloConAcento(op.name)}</h1>
              {op.bio ? <p>{op.bio}</p> : null}
              <span className="meta">{meta}</span>
              {ig ? (
                <a
                  className="pub-chip"
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ alignSelf: "flex-start", color: "#fff" }}
                >
                  @{ig}
                </a>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <>
          <NavCream t={op.name} s="operador" backHref="/caminante/experiencias" />
          <Sec style={{ paddingTop: 10 }}>
            <Eyeb>Operador</Eyeb>
            <h2>{tituloConAcento(op.name)}</h2>
            {op.bio ? <p>{op.bio}</p> : null}
            <p className="pub-mono" style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 10 }}>
              {meta}
            </p>
            {ig ? (
              <a
                className="pub-chip solid"
                href={`https://instagram.com/${ig}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 12 }}
              >
                @{ig}
              </a>
            ) : null}
          </Sec>
        </>
      )}

      {pild.length ? (
        <Sec>
          <Eyeb>Su recorrido</Eyeb>
          <div className="pub-pild">
            {pild.map((p) => (
              <div className="pd" key={p.k}>
                <b className="pub-mono">{p.v}</b>
                <small>{p.k}</small>
              </div>
            ))}
          </div>
        </Sec>
      ) : null}

      {op.experiencias.length ? (
        <Sec>
          <Eyeb>Sus experiencias</Eyeb>
          <h2>
            Los caminos que <em>abre.</em>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            {op.experiencias.map((e) => (
              <div key={e.slug}>
              <Link
                className="pub-expcard"
                style={{ minHeight: 200 }}
                href={`/caminante/experiencias/${e.slug}`}
              >
                {e.image ? (
                  <div className="ph">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.image} alt={e.imageAlt || e.title} />
                  </div>
                ) : null}
                <div className="veil" />
                <div className="inner">
                  {e.ploc ? <span className="date">{e.ploc}</span> : null}
                  <h3 style={{ fontSize: 22 }}>{e.title}</h3>
                  <div className="row">
                    {!e.rating ? <span className="pub-chip">Experiencia nueva</span> : null}
                    <span className="pub-chip solid">Ver experiencia →</span>
                  </div>
                </div>
              </Link>
              {/* La calificación NUNCA encima de la foto: en naranja se pierde
                  (Luis, 11 ago). Va abajo, sobre fondo claro. */}
              {e.rating ? (
                <Estrellas
                  stars={e.rating.stars}
                  count={e.rating.count}
                  style={{ marginTop: 10, paddingLeft: 2 }}
                />
              ) : null}
              </div>
            ))}
          </div>
        </Sec>
      ) : null}

      {equipo.length ? (
        <Sec>
          <Eyeb>Su equipo</Eyeb>
          <h2>
            Quienes caminan <em>contigo.</em>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {equipo.map((t, i) => (
              <div className="pub-guide" key={i}>
                {t.photoUrl ? (
                  <div className="av">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.photoUrl} alt={t.name} style={adjustStyle(t.adjust)} />
                  </div>
                ) : null}
                <div className="g">
                  <b>{t.name}</b>
                  {t.role ? <small>{t.role}</small> : null}
                  {t.quote ? <p>{t.quote}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </Sec>
      ) : null}

      {op.testimonios.length ? (
        <Sec style={{ paddingBottom: 28 }}>
          <Eyeb>Lo que dicen sus viajeros</Eyeb>
          <h2>
            Palabras del <em>camino.</em>
          </h2>
          <div style={{ marginTop: 14 }}>
            {op.testimonios.map((t, i) => (
              <Testi
                key={i}
                texto={t.text}
                firma={[t.initials, t.location].filter(Boolean).join(" · ")}
              />
            ))}
          </div>
        </Sec>
      ) : (
        <div style={{ height: 28 }} />
      )}
    </div>
  );
}
