"use client";

// LA BIBLIOTECA — la mitad «Gente» de Comunidad.
//
// Transcrito de design/comunidad/dc/comunidad.dc.html (familia .gn*).
//
// Es una LISTA densa, no una rejilla de tarjetas: 60 personas caben en dos
// pantallas y se barren con el ojo. Y una sola decisión encendida a la vez —
// cinco facetas simultáneas fue justo lo que no se entendía.

import { useMemo, useState } from "react";
import type { PersonaBiblio, Biblioteca as Datos } from "@/lib/comunidad/biblioteca";

type Filtro = "todos" | "vinieron" | "no" | "boletin" | "tag";

function Iconos({ p }: { p: PersonaBiblio }) {
  const wa = p.telefono ? `https://wa.me/${p.telefono.replace(/\D/g, "")}` : null;
  return (
    <span className="ic">
      {wa ? (
        <a href={wa} target="_blank" rel="noopener noreferrer" title={`WhatsApp · ${p.telefono}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-label="WhatsApp">
            <path d="M21 11.5a8.4 8.4 0 0 1-12.7 7.2L3 20.5l1.8-5.2A8.4 8.4 0 1 1 21 11.5Z" />
          </svg>
        </a>
      ) : (
        /* Apagado, no ausente: que se vea que a esta persona no se le puede
           escribir por ahí. Son 10 de 60. */
        <span className="off" title="Sin teléfono">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-label="Sin WhatsApp">
            <path d="M21 11.5a8.4 8.4 0 0 1-12.7 7.2L3 20.5l1.8-5.2A8.4 8.4 0 1 1 21 11.5Z" />
            <path d="M4 4l16 16" />
          </svg>
        </span>
      )}
      {p.email ? (
        <a href={`mailto:${p.email}`} title={p.email}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-label="Correo">
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
          </svg>
        </a>
      ) : (
        <span className="off" title="Sin correo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-label="Sin correo">
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 4l16 16" />
          </svg>
        </span>
      )}
    </span>
  );
}

export default function Biblioteca({ d }: { d: Datos }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<"historia" | "persona">("historia");
  const [abierta, setAbierta] = useState<string | null>(null);

  const hayTags = d.personas.some((p) => p.tags.length > 0);

  const vista = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = d.personas.filter((p) => {
      if (filtro === "vinieron" && p.viajes.length === 0) return false;
      if (filtro === "no" && p.viajes.length > 0) return false;
      if (filtro === "boletin" && !p.boletin) return false;
      if (filtro === "tag" && p.tags.length === 0) return false;
      if (!t) return true;
      return (
        p.nombre.toLowerCase().includes(t) ||
        (p.email ?? "").toLowerCase().includes(t) ||
        (p.telefono ?? "").includes(t)
      );
    });
    return orden === "persona" ? [...out].sort((a, b) => a.nombre.localeCompare(b.nombre)) : out;
  }, [d.personas, filtro, q, orden]);

  const persona = abierta ? d.personas.find((p) => p.id === abierta) ?? null : null;

  const pill = (id: Filtro, label: string, n: number) => (
    <button key={id} className={`gnp${filtro === id ? " on" : ""}`} onClick={() => setFiltro(id)}>
      {label}
      <span className="n">{n}</span>
    </button>
  );

  return (
    <>
      {/* ── Los cumpleaños. El corte es HOY y lo que viene, nunca «este mes»:
          en un día 27, un mes enseñaría felicitaciones que ya se fueron.
          Y si no hay nadie, la banda no se dibuja — sería ruido 340 días. ── */}
      {d.cumples.hoy.length || d.cumples.semana.length || d.cumples.proximos.length ? (
        <div className="gncum">
          <span className="lb">
            <s>{"//"}</s>Cumpleaños
          </span>
          {d.cumples.hoy.length ? (
            <div className="gnpa">
              {d.cumples.hoy.map((p) => (
                <div className="hoy" key={p.id}>
                  <span className="av">{p.iniciales}</span>
                  <span className="g">
                    <b>{p.nombre}</b>
                    <small>
                      Cumple hoy, {p.cumple}
                      {p.viajes[0] ? ` · viajó a ${p.viajes[0].experiencia}` : ""}
                    </small>
                  </span>
                  <span className="rt">
                    <button type="button" className="btn btn-glass btn-sm" onClick={() => setAbierta(p.id)}>
                      Ver su ficha
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {d.cumples.semana.length || d.cumples.proximos.length ? (
            <div className="nx">
              {d.cumples.semana.length ? (
                <span className="grp">
                  <span className="t">Esta semana</span>
                  {d.cumples.semana.map((p) => (
                    <span className="p" key={p.id}>
                      {p.nombre}
                      <span className="dt">{p.cumple}</span>
                    </span>
                  ))}
                </span>
              ) : null}
              {d.cumples.proximos.length ? (
                <span className="grp">
                  <span className="t">Los próximos 30 días</span>
                  {d.cumples.proximos.map((p) => (
                    <span className="p" key={p.id}>
                      {p.nombre}
                      <span className="dt">{p.cumple}</span>
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* La ciudad sucia se dice con su cuenta REAL. Mientras esté así no hay
          filtro de ciudad: filtrar con varias grafías mentiría. */}
      {d.ciudadSucia ? (
        <div className="gnfix">
          <s>{"//"}</s>
          <span className="g">
            <b>{d.ciudadSucia.cuantas} personas</b> escribieron su ciudad de{" "}
            {d.ciudadSucia.variantes.length} formas distintas:{" "}
            {d.ciudadSucia.variantes.map((v) => `«${v.texto}» ${v.n}`).join(" · ")}.
          </span>
        </div>
      ) : null}

      <div className="gnhead">
        <div className="gnpills">
          {pill("todos", "Todos", d.conteos.todos)}
          {pill("vinieron", "Ya vinieron", d.conteos.vinieron)}
          {pill("no", "Todavía no", d.conteos.todaviaNo)}
          {pill("boletin", "En el boletín", d.conteos.boletin)}
          {pill("tag", "Con etiqueta", d.conteos.conTag)}
        </div>
        <div className="gntools">
          <input
            type="search"
            placeholder="Nombre, correo o teléfono"
            aria-label="Buscar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className={`gnlist${hayTags ? " contags" : ""}`}>
        <div className="gnhd">
          <span />
          <button className={`gnsort${orden === "persona" ? " on" : ""}`} onClick={() => setOrden("persona")}>
            Persona<s>↑</s>
          </button>
          {hayTags ? <span>Etiquetas</span> : null}
          <button className={`gnsort${orden === "historia" ? " on" : ""}`} onClick={() => setOrden("historia")}>
            Su historia<s>↓</s>
          </button>
          <span className="r">Contacto</span>
        </div>

        {vista.length === 0 ? (
          <div className="empty">Nadie coincide con esa búsqueda.</div>
        ) : (
          vista.map((p) => (
            <div
              className="gnr"
              key={p.id}
              onClick={() => setAbierta(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setAbierta(p.id);
              }}
            >
              <span className="av">{p.iniciales}</span>
              <span className="who">
                <span className="nmline">
                  <b>{p.nombre}</b>
                </span>
                {p.ciudad ? <small>{p.ciudad}</small> : null}
              </span>
              {hayTags ? (
                <span className="gntags">
                  {p.tags.slice(0, 2).map((t) => (
                    <span className="gnt" key={t}>
                      {t}
                    </span>
                  ))}
                  {p.tags.length > 2 ? <span className="gnt mas">+{p.tags.length - 2}</span> : null}
                </span>
              ) : null}
              <span className="hist">
                {p.viajes.length ? (
                  <>
                    <b>{p.viajes.length}</b> {p.viajes.length === 1 ? "viaje" : "viajes"}{" "}
                    <i>· {p.viajes.map((v) => v.experiencia).join(", ")}</i>{" "}
                    {p.viajes[0].cuando ? <u>· {p.viajes[0].cuando}</u> : null}
                  </>
                ) : (
                  /* Quien no ha venido NO es un contacto de segunda: es a quien
                     querrías invitar. Su origen es lo que cuenta de él. */
                  <em>Todavía no ha venido · {p.origen.toLowerCase()}</em>
                )}
              </span>
              <Iconos p={p} />
            </div>
          ))
        )}
      </div>

      {/* La ficha entra por la derecha, igual que en el CRM: mismo componente,
          una sola interacción que aprender en toda la pantalla. */}
      {persona ? (
        <>
          <div className="cmveil" onClick={() => setAbierta(null)} />
          <aside className="gnficha">
            <header>
              <span className="av">{persona.iniciales}</span>
              <span className="g">
                <b>{persona.nombre}</b>
                <small>{persona.ciudad || "Sin ciudad"}</small>
              </span>
              <button type="button" className="x" onClick={() => setAbierta(null)} aria-label="Cerrar">
                ×
              </button>
            </header>
            <div className="bd">
              <div className="gnmeta">
                {persona.email ? <a href={`mailto:${persona.email}`}>{persona.email}</a> : <span className="hole">sin correo</span>}
                {persona.telefono ? <span>{persona.telefono}</span> : <span className="hole">sin teléfono</span>}
              </div>

              <div className="gnhint">Te sigue desde: {persona.origen}</div>

              <h4 className="xh4">Sus viajes</h4>
              {persona.viajes.length ? (
                persona.viajes.map((v, i) => (
                  <div className="gnfila" key={i}>
                    <span>{v.experiencia}</span>
                    <span className="mono">{v.cuando}</span>
                  </div>
                ))
              ) : (
                <p className="mut" style={{ fontSize: 13 }}>Ninguno todavía.</p>
              )}

              {persona.voz.length ? (
                <>
                  <h4 className="xh4">Su voz</h4>
                  {persona.voz.map((v, i) => (
                    <blockquote className="gnp" key={i} style={{ display: "block" }}>
                      «{v.texto}»
                      <cite>
                        Encuesta · {v.cuando} · {v.publicable ? "con permiso de publicación" : "sin permiso de publicación"}
                      </cite>
                    </blockquote>
                  ))}
                </>
              ) : null}

              <h4 className="xh4">Boletín y cumpleaños</h4>
              <div className="gnfila">
                <span>{persona.boletin ? "En el boletín" : "No está en el boletín"}</span>
                <span className={persona.cumple ? "mono" : "hole"}>{persona.cumple ?? "sin fecha"}</span>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
