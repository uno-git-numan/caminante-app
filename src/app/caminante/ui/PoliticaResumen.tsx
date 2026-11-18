// LA POLÍTICA DE CANCELACIÓN EN LAS PANTALLAS DE PAGO (D23 de legal, §2).
//
// En reservar y en la página de pago el cliente ve un RESUMEN de tres renglones
// con el texto completo desplegable, y junto al botón la frase «Al pagar
// aceptas la política de cancelación de esta experiencia». No hay casilla: el
// texto a la vista antes de pagar y la frase bastan como aceptación (LFPC 76
// Bis III); la prueba queda en la reserva (variante + huella + fecha).
//
// Dos pieles para el mismo contenido, porque esas pantallas tienen dos
// marcados: el de escritorio (Tailwind) y el móvil (clases `pub-`). El texto
// sale de lib/cancelacion/politica.ts, transcrito de legal. Sin hooks: sirve
// igual en componentes de servidor y de cliente.

import type { CSSProperties, ReactNode } from "react";
import { bloquesPolitica, FRASE_ACEPTACION, resumenPolitica, TITULO_POLITICA, type Variante } from "@/lib/cancelacion/politica";
import { CONTACTO_CAMINANTE, contactoPropioDe, DOMICILIO_NUMAN, RAZON_SOCIAL_NUMAN, waHref } from "@/lib/legal/responsable";

const negritas = (t: string): ReactNode[] => t.split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x));

/** Escritorio: reservar (CheckoutForm) y página de pago. */
export function PoliticaResumenEscritorio({ variante }: { variante: Variante }) {
  return (
    <div className="rounded-xl border border-sand px-4 py-3 text-[12px] leading-relaxed text-olive">
      <p className="font-semibold text-lagoon">{TITULO_POLITICA}</p>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {resumenPolitica(variante).map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <details className="mt-2">
        <summary className="cursor-pointer font-semibold text-forest underline">Ver la política completa</summary>
        {bloquesPolitica(variante).map((b, i) => (
          <div key={i} className="mt-3">
            <p className="font-semibold text-lagoon">{b.titulo}</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {b.renglones.map((r, j) => (
                <li key={j}>{negritas(r)}</li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </div>
  );
}

/** La frase junto al botón de pagar, escritorio. */
export function FraseAceptacionEscritorio() {
  return <p className="text-center text-[11px] text-olive/70">{FRASE_ACEPTACION}</p>;
}

/** Móvil: mismo bloque y mismo acordeón que el resto de la pantalla (`pub-blk`, `pub-faq`). */
export function PoliticaResumenMovil({ variante }: { variante: Variante }) {
  return (
    <div className="pub-blk">
      <span className="pub-lbl">{TITULO_POLITICA}</span>
      {resumenPolitica(variante).map((r, i) => (
        <p key={i} style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: i ? 6 : 4, lineHeight: 1.45 }}>
          {r}
        </p>
      ))}
      <div className="pub-faq" style={{ marginTop: 10 }}>
        <details>
          <summary>
            Ver la política completa
            <span className="x">+</span>
          </summary>
          {bloquesPolitica(variante).map((b, i) => (
            <div className="a" key={i} style={i ? { marginTop: 12 } : undefined}>
              <b>{b.titulo}</b>
              {b.renglones.map((r, j) => (
                <div key={j} style={{ marginTop: 6 }}>
                  {negritas(r)}
                </div>
              ))}
            </div>
          ))}
        </details>
      </div>
    </div>
  );
}

/** La frase junto al botón de pagar, móvil. */
export function FraseAceptacionMovil() {
  return <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8, textAlign: "center" }}>{FRASE_ACEPTACION}</p>;
}

// RECLAMACIONES Y ACLARACIONES, ANTES DE PAGAR (LFPC 76 Bis III; D24 y D25 de
// legal). El proveedor tiene que dejar a la vista, antes de la transacción, su
// domicilio físico y los medios para reclamar. Va en reservar y en la página
// de pago, haya o no política elegida.
//
// Caminante aparece SIEMPRE, también cuando vende una operadora: responde por
// la devolución frente al cliente. El contacto de quien opera se suma sólo si
// es distinto. El domicilio es el de NUMAN (lib/legal/responsable.ts); el de la
// operadora no se publica.

type Contacto = { whatsapp: string | null; email: string | null };

function Medios({ c, estilo }: { c: Contacto; estilo?: CSSProperties }) {
  return (
    <>
      {c.whatsapp ? (
        <>
          WhatsApp{" "}
          <a className="underline" style={estilo} href={waHref(c.whatsapp)} target="_blank" rel="noopener">
            {c.whatsapp}
          </a>
        </>
      ) : null}
      {c.whatsapp && c.email ? " · " : ""}
      {c.email ? (
        <a className="underline" style={estilo} href={`mailto:${c.email}`}>
          {c.email}
        </a>
      ) : null}
    </>
  );
}

function Renglones({ contacto, estilo }: { contacto: Contacto | null; estilo?: CSSProperties }) {
  const propio = contactoPropioDe(contacto);
  return (
    <>
      <b>Reclamaciones y aclaraciones.</b> Caminante: <Medios c={CONTACTO_CAMINANTE} estilo={estilo} />.
      {propio ? (
        <>
          {" "}Quien opera tu experiencia: <Medios c={propio} estilo={estilo} />.
        </>
      ) : null}{" "}
      {RAZON_SOCIAL_NUMAN}, {DOMICILIO_NUMAN}.
    </>
  );
}

/** Escritorio. */
export function ContactoReclamacionesEscritorio({ contacto }: { contacto: Contacto | null }) {
  return (
    <p className="text-center text-[11px] leading-relaxed text-olive/70">
      <Renglones contacto={contacto} />
    </p>
  );
}

/** Móvil. */
export function ContactoReclamacionesMovil({ contacto }: { contacto: Contacto | null }) {
  return (
    <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-soft)", marginTop: 8, textAlign: "center" }}>
      <Renglones contacto={contacto} estilo={{ textDecoration: "underline", color: "inherit" }} />
    </p>
  );
}
