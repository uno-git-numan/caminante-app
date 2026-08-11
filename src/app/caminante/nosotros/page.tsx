import type { Metadata } from "next";
import Link from "next/link";
import PubStyles from "../ui/pub/PubStyles";
import PubShell from "../ui/pub/PubShell";
import { Eyeb, HeadFloat, Sec } from "../ui/pub/atoms";
import { unaFotoDelBanco } from "@/lib/publico/fotos";

// «Nosotros · por qué caminamos» — transcrita de PubNosotros
// (design/publico-movil/pub-c.jsx). Copy verbatim del entregable.
//
// Esta ruta NO existía: `SiteChrome.navItems` ya la ofrecía y daba 404. Como no
// hay escritorio que respetar, el diseño aplica en todo ancho (`modo="solo"`).
//
// Las dos fotos salen del banco real de las experiencias publicadas — el
// mockup ponía rectángulos de color con la pista `paisaje · nosotros` y
// `comunidad · nosotros`. Si el banco no tiene, el bloque se cae con gracia.

export const metadata: Metadata = {
  title: "Nosotros · Caminante",
  description:
    "Caminar es fisiología. Llevamos gente a lugares reales de México con ciencia real y guías que llevan años leyéndolos.",
};

export const revalidate = 3600;

export default async function NosotrosPage() {
  const [paisaje, comunidad] = await Promise.all([
    unaFotoDelBanco(["paisaje", "cielo"]),
    unaFotoDelBanco(["comunidad", "gente"]),
  ]);

  return (
    <>
      <PubStyles modo="solo" />
      <PubShell>
        <div className="pub-screen">
          <HeadFloat back backHref="/caminante" />

          <div className="pub-hero" style={{ minHeight: 520 }}>
            {paisaje ? (
              <div className="ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paisaje} alt="Bosque de niebla" />
              </div>
            ) : null}
            <div className="veil" />
            <div className="inner">
              <Eyeb neg>Nosotros</Eyeb>
              <h1>
                Caminar es <em>fisiología.</em>
              </h1>
              <p>
                Veinte minutos de bosque bajan el cortisol medible en saliva. No es una frase bonita:
                es cómo funciona tu cuerpo.
              </p>
            </div>
          </div>

          <Sec>
            <Eyeb>Qué es Caminante</Eyeb>
            <h2>
              El medio es <em>el lugar.</em>
            </h2>
            <p>
              Llevamos gente a lugares reales de México — un bosque de hongos, un mar con lobos
              marinos, un cañón más profundo que el Gran Cañón — con ciencia real y guías que llevan
              años leyéndolos.
            </p>
            <p>
              No vendemos paisaje: cada salida es la etapa de naturaleza del método numan, hecha
              cuerpo.
            </p>
          </Sec>

          <Sec>
            <Eyeb>El método</Eyeb>
            <h2>
              movimiento → naturaleza → introspección → <em>creatividad.</em>
            </h2>
            <p>
              <em style={{ color: "var(--orange)" }}>En ese orden, porque el orden es el método.</em>{" "}
              Primero el cuerpo, después el lugar, al final tú. Donde pones tu atención, ahí va tu
              energía.
            </p>
          </Sec>

          <Sec>
            <Eyeb>Las cuatro caras de cada lugar</Eyeb>
            <div className="pub-inc">
              <div className="row">
                <span className="sl">{"//"}</span>
                <span>
                  Naturaleza<small>Lo que el lugar es: especies, temporadas, datos con fuente</small>
                </span>
              </div>
              <div className="row">
                <span className="sl">{"//"}</span>
                <span>
                  Conservación<small>Lo que el lugar necesita para seguir siendo</small>
                </span>
              </div>
              <div className="row">
                <span className="sl">{"//"}</span>
                <span>
                  Comunidades<small>De quién es la montaña, y qué deja cada visita</small>
                </span>
              </div>
              <div className="row">
                <span className="sl">{"//"}</span>
                <span>
                  Problemas<small>Lo que amenaza al lugar — también se cuenta</small>
                </span>
              </div>
            </div>
            <p style={{ marginTop: 12 }}>
              Con ese marco se lee cada destino: no hay experiencia sin sus cuatro caras.
            </p>
          </Sec>

          <Sec>
            <Eyeb>Conservación</Eyeb>
            <h2>
              Una parte de <em>cada viaje.</em>
            </h2>
            <p>
              Parte de lo que pagas se queda en el lugar: permisos al ejido, guías locales, cocina de
              las comunidades. El viaje que no deja algo, quita.
            </p>
            {comunidad ? (
              <div
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  marginTop: 16,
                  height: 180,
                  boxShadow: "var(--shadow)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={comunidad} alt="Las comunidades con las que trabajamos" />
              </div>
            ) : null}
          </Sec>

          <Sec>
            <Eyeb>A quién servimos</Eyeb>
            <h2>
              Tres <em>orillas.</em>
            </h2>
            <div className="pub-inc">
              <div className="row">
                <span className="sl">{"//"}</span>
                <span>
                  A quien camina<small>Experiencias con ciencia, sin disfraz de tour</small>
                </span>
              </div>
              <div className="row">
                <span className="sl">{"//"}</span>
                <span>
                  A quien opera<small>La plataforma completa: venta, deslindes, comunicación</small>
                </span>
              </div>
              <div className="row">
                <span className="sl">{"//"}</span>
                <span>
                  Al lugar<small>Derrama directa y datos que ayudan a conservarlo</small>
                </span>
              </div>
            </div>
          </Sec>

          <Sec style={{ paddingBottom: 30 }}>
            <Link className="pub-cta pub-cta-orange" href="/caminante/calendario">
              Ver próximas salidas
            </Link>
          </Sec>
        </div>
      </PubShell>
    </>
  );
}
