"use client";

// La pantalla de PubExps (design/publico-movil/pub-a.jsx). Marcado y clases
// VERBATIM del entregable; los datos los arma `page.tsx` (server) y bajan por
// props. Es cliente porque `pfmt` vive en PubShell, que es "use client".
//
// Cambios respecto al mockup, todos por la misma razón (la demo era una pila de
// React sin URLs, y no hay campo de categoría en el modelo):
//   · `nav.push("exp",{id})`     → <Link href="/caminante/experiencias/<slug>">
//   · `nav.push("destino",{d})`  → <Link href="/caminante/destinos/<slug>">
//   · La agrupación por `e.cat` desaparece: no existe ese campo. Las
//     experiencias van en UNA lista, sin rótulos de categoría inventados.

import Link from "next/link";
import { pfmt, usePubUI } from "../ui/pub/PubShell";
import { Eyeb, HeadFloat, Sec } from "../ui/pub/atoms";
import type { DestinoCard } from "@/lib/destinos/queries";

export type SalidaVM = {
  label: string;
  startsAt: string | null;
  available: number | null; // null = salida sin tope
  soldOut: boolean;
};

export type ExpVM = {
  slug: string;
  nombre: string;
  titulo: string;
  acento: string;
  lugar: string;
  imagen: string;
  imagenAlt: string;
  precio: number | null;
  salidas: SalidaVM[];
  rating: { stars: number; count: number } | null;
};

export type Destacado = { k: string; v: string; exp: ExpVM };

/** La foto de la tarjeta. Si no hay, el hueco se queda vacío — jamás se rellena
 *  con una foto que no es de ese lugar (regla del PATRÓN). */
function Foto({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <div className="ph">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </div>
  );
}

export default function ExpsScreen({
  exps,
  lugares,
  destacados,
}: {
  exps: ExpVM[];
  lugares: DestinoCard[];
  destacados: Destacado[];
}) {
  const ui = usePubUI();

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <HeadFloat oncream onMenu={() => ui.abrirHoja("menu")} />
      <div className="pub-headpad"></div>

      {destacados.length > 0 ? (
        <>
          <Sec style={{ paddingTop: 10 }}>
            <Eyeb>Destacados</Eyeb>
            <h2>
              Por dónde <em>empezar.</em>
            </h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              La fecha más próxima y la mejor calificada.
            </p>
          </Sec>
          <div className="pub-rail">
            {destacados.map((d) => (
              <Link
                className="pub-expcard rl"
                key={d.k}
                href={`/caminante/experiencias/${d.exp.slug}`}
              >
                <Foto src={d.exp.imagen} alt={d.exp.imagenAlt} />
                <div className="veil"></div>
                <div className="inner">
                  <span className="date" style={{ color: "var(--orange)" }}>
                    {d.k}
                  </span>
                  <h3 style={{ fontSize: 22 }}>
                    {d.exp.titulo} {d.exp.acento ? <em>{d.exp.acento}</em> : null}
                  </h3>
                  <div className="row">
                    <span className="pub-chip">{d.v}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {lugares.length > 0 ? (
        <>
          <Sec style={{ paddingTop: 26 }}>
            <Eyeb>Lugares</Eyeb>
            <h2>
              Dónde <em>caminamos.</em>
            </h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
              Entra a un lugar y ahí encuentras sus experiencias.
            </p>
          </Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px" }}>
            {lugares.map((l) => (
              <Link
                key={l.slug}
                className="pub-expcard"
                style={{ minHeight: 150 }}
                href={`/caminante/destinos/${l.slug}`}
              >
                <Foto src={l.imageUrl} alt={l.estado} />
                <div className="veil"></div>
                <div className="inner">
                  <span className="date">{l.estado}</span>
                  <h3 style={{ fontSize: 21 }}>
                    {l.titulo} {l.acento ? <em>{l.acento}</em> : null}
                  </h3>
                  <div className="row">
                    <span className="pub-chip">
                      {l.experiencias === 0
                        ? "Conocer el lugar"
                        : l.experiencias === 1
                          ? "1 experiencia"
                          : l.experiencias + " experiencias"}{" "}
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <Sec id="exps-todas" style={{ paddingTop: 26 }}>
        <Eyeb>Todas</Eyeb>
        <h2 style={{ fontSize: 24 }}>
          {exps.length === 1 ? "Una experiencia" : exps.length + " experiencias"}{" "}
          <em>publicadas.</em>
        </h2>
      </Sec>

      {exps.length === 0 ? (
        <div style={{ padding: "0 20px" }}>
          <div className="pub-blk">
            <div className="pub-state" style={{ padding: "8px 0" }}>
              <h3>Todavía no hay experiencias publicadas</h3>
              <p>En cuanto abra la primera, aparece aquí con sus fechas.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 20px 24px" }}>
          {exps.map((e) => (
            <Link className="pub-expcard" key={e.slug} href={`/caminante/experiencias/${e.slug}`}>
              <Foto src={e.imagen} alt={e.imagenAlt} />
              <div className="veil"></div>
              <div className="inner">
                <span className="date">{e.lugar}</span>
                <h3>
                  {e.titulo} {e.acento ? <em>{e.acento}</em> : null}
                </h3>
                <div className="row">
                  {e.salidas.length ? (
                    <>
                      <span className="pub-chip">
                        {e.salidas[0].label}
                        {e.salidas.length > 1 ? " +" + (e.salidas.length - 1) : ""}
                      </span>
                      {e.precio != null ? (
                        <span className="pub-chip">desde {pfmt(e.precio)}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="pub-chip solid">Sin fechas · solicita la tuya</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ padding: "20px 20px 24px" }}>
        <Link className="pub-cta pub-cta-ghost" href="/caminante/calendario">
          Ver el calendario completo
        </Link>
      </div>
    </div>
  );
}
