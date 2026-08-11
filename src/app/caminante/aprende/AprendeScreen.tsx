"use client";

// La pantalla de PubAprende (design/publico-movil/pub-aprende.jsx). El marcado y
// las clases van VERBATIM: cabecera flotante sobre crema, los dos carruseles de
// filtros (`.cap-filtros` por lugar, `.cap-cara` por cara) y el estado vacío del
// bloque de cápsulas.
//
// El contenido NO son cápsulas (no existen): es la ficha científica real de cada
// experiencia publicada. Cada dato lleva su fuente visible, siempre.
//
// El filtro por CARA es real, no decorativo: `Experience.ficha.datos[].cara`
// guarda biologia|conservacion|comunidades|problemas — las cuatro caras de la
// casa. «biologia» se rotula «naturaleza», que es como se llama la cara en la
// voz de marca. Con una cara elegida solo se muestran los datos de esa cara
// (especies, glosario y temporada no llevan cara).

import { useState } from "react";
import Link from "next/link";
import { usePubUI } from "../ui/pub/PubShell";
import { Eyeb, HeadFloat, Sec } from "../ui/pub/atoms";

export type DatoFicha = { n: string; texto: string; fuente: string; cara: string };

export type LugarFicha = {
  slug: string;
  nombre: string;
  estado: string;
  datos: DatoFicha[];
  especies: { comun: string; cientifico: string; datos: { texto: string; fuente: string }[] }[];
  glosario: { termino: string; def: string }[];
  temporada: { epoca: string; fenomeno: string; fuente: string }[];
};

// Rótulo público ← valor guardado en la ficha.
const CARAS: [string, string][] = [
  ["naturaleza", "biologia"],
  ["conservación", "conservacion"],
  ["comunidades", "comunidades"],
  ["problemas", "problemas"],
];

export default function AprendeScreen({
  lugares,
  fotoNosotros,
}: {
  lugares: LugarFicha[];
  fotoNosotros: string | null;
}) {
  const ui = usePubUI();
  const [lugar, setLugar] = useState("Todos");
  const [cara, setCara] = useState<string | null>(null);

  const estados = ["Todos", ...new Set(lugares.map((l) => l.estado).filter(Boolean))];

  // Con una cara elegida, la pantalla se reduce a los datos de esa cara.
  const lista = lugares
    .filter((l) => lugar === "Todos" || l.estado === lugar)
    .map((l) => (cara ? { ...l, datos: l.datos.filter((d) => d.cara === cara) } : l))
    .filter((l) =>
      cara
        ? l.datos.length > 0
        : l.datos.length > 0 || l.especies.length > 0 || l.glosario.length > 0 || l.temporada.length > 0,
    );

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <HeadFloat oncream onMenu={() => ui.abrirHoja("menu")} />
      <div className="pub-headpad"></div>

      <Sec style={{ paddingTop: 6 }}>
        <Eyeb>Aprende</Eyeb>
        <h2>
          Lo que sabemos de <em>cada lugar.</em>
        </h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)" }}>
          Cada dato lleva su fuente — sin fuente, el dato no entra. Es la regla de la casa.
        </p>
      </Sec>

      {estados.length > 2 ? (
        <div className="cap-filtros">
          {estados.map((l) => (
            <button
              key={l}
              className={"pub-cta pub-cta-sm " + (lugar === l ? "pub-cta-forest" : "pub-cta-ghost")}
              onClick={() => setLugar(l)}
            >
              {l}
            </button>
          ))}
        </div>
      ) : null}

      <div className="cap-filtros" style={{ paddingTop: 0 }}>
        {CARAS.map(([rotulo, valor]) => (
          <button
            key={valor}
            className={"cap-cara" + (cara === valor ? " on" : "")}
            onClick={() => setCara(cara === valor ? null : valor)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div style={{ padding: "12px 20px 0" }}>
          <div className="pub-blk">
            <div className="pub-state" style={{ padding: "6px 0" }}>
              <h3>Nada aquí todavía</h3>
              <p>
                Esa cara de este lugar aún no tiene datos documentados. La ficha se llena conforme
                caminamos y confirmamos la fuente.
              </p>
            </div>
          </div>
        </div>
      ) : (
        lista.map((l) => (
          <div key={l.slug}>
            <Sec style={{ paddingTop: 26 }}>
              <Eyeb>{l.estado}</Eyeb>
              <h2 style={{ fontSize: 24 }}>
                {l.nombre}
                <em>.</em>
              </h2>

              {l.datos.map((d, i) => (
                <div className="cap-dato" key={i}>
                  <p>
                    {d.n ? <b>{d.n} </b> : null}
                    {d.texto}
                  </p>
                  <span className="pub-fuente">Fuente · {d.fuente}</span>
                </div>
              ))}
            </Sec>

            {!cara && l.especies.length > 0 ? (
              <Sec style={{ paddingTop: 10 }}>
                <Eyeb>Especies</Eyeb>
                <div className="pub-ficha">
                  {l.especies.map((sp, i) => (
                    <details key={sp.comun} open={i === 0}>
                      <summary>
                        <b>
                          {sp.comun}
                          {sp.cientifico ? <i>{sp.cientifico}</i> : null}
                        </b>
                        <span className="x">+</span>
                      </summary>
                      <div className="body">
                        {sp.datos.map((d, j) => (
                          <div key={j} style={{ marginTop: j ? 14 : 0 }}>
                            {d.texto}
                            <span className="pub-fuente">Fuente · {d.fuente}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </Sec>
            ) : null}

            {!cara && l.glosario.length > 0 ? (
              <Sec style={{ paddingTop: 10 }}>
                <Eyeb>Glosario</Eyeb>
                <div className="pub-ficha">
                  {l.glosario.map((g, i) => (
                    <details key={g.termino} open={i === 0}>
                      <summary>
                        <b>{g.termino}</b>
                        <span className="x">+</span>
                      </summary>
                      <div className="body">{g.def}</div>
                    </details>
                  ))}
                </div>
              </Sec>
            ) : null}

            {!cara && l.temporada.length > 0 ? (
              <Sec style={{ paddingTop: 10 }}>
                <Eyeb>Temporada</Eyeb>
                <div className="pub-inc">
                  {l.temporada.map((t, i) => (
                    <div className="row" key={i}>
                      <span className="sl">{"//"}</span>
                      <span>
                        {t.epoca}
                        <small>{t.fenomeno}</small>
                        {t.fuente ? <span className="pub-fuente">Fuente · {t.fuente}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </Sec>
            ) : null}

            <Sec style={{ paddingTop: 12 }}>
              <Link
                className="pub-cta pub-cta-ghost pub-cta-sm"
                href={`/caminante/experiencias/${l.slug}`}
              >
                Ir a la experiencia →
              </Link>
            </Sec>
          </div>
        ))
      )}

      {/* El hueco de las cápsulas largas del diseño. No hay tabla de artículos y
          no se inventan: se dice qué falta y por qué va a llegar. */}
      <Sec style={{ paddingTop: 26 }}>
        <Eyeb>Cápsulas</Eyeb>
        <div style={{ marginTop: 12 }}>
          <div className="pub-blk">
            <div className="pub-state" style={{ padding: "6px 0" }}>
              <h3>Estamos produciendo el contenido</h3>
              <p>
                Los artículos, las guías de campo y los ensayos fotográficos se están escribiendo con
                el material documentado de cada salida. Van a ir apareciendo aquí, uno por uno.
              </p>
            </div>
          </div>
        </div>
      </Sec>

      <Sec style={{ paddingBottom: 30 }}>
        <Eyeb>El porqué</Eyeb>
        <Link className="pub-expcard" style={{ minHeight: 180, marginTop: 14 }} href="/caminante/nosotros">
          {fotoNosotros ? (
            <div className="ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoNosotros} alt="El bosque de niebla" />
            </div>
          ) : null}
          <div className="veil"></div>
          <div className="inner">
            <Eyeb neg>Nosotros</Eyeb>
            <h3 style={{ fontSize: 22 }}>
              Por qué <em>caminamos.</em>
            </h3>
          </div>
        </Link>
      </Sec>
    </div>
  );
}
