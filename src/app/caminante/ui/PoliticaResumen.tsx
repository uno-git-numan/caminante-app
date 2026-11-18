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

import type { ReactNode } from "react";
import { bloquesPolitica, FRASE_ACEPTACION, resumenPolitica, TITULO_POLITICA, type Variante } from "@/lib/cancelacion/politica";

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

// A QUIÉN ACUDIR, ANTES DE PAGAR (LFPC 76 Bis III; D24 de legal). El proveedor
// tiene que dejar a la vista, antes de la transacción, los medios para
// presentar una reclamación. Va en reservar y en la página de pago, haya o no
// política elegida. ⚠️ La ley pide también el DOMICILIO FÍSICO: hoy no se
// publica en ningún lado; falta que Luis diga cuál.

type Contacto = { whatsapp: string | null; email: string | null };

const waHref = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;

/** Escritorio. */
export function ContactoReclamacionesEscritorio({ contacto }: { contacto: Contacto }) {
  if (!contacto.whatsapp && !contacto.email) return null;
  return (
    <p className="text-center text-[11px] text-olive/70">
      ¿Dudas o una reclamación? Escríbenos
      {contacto.whatsapp ? (
        <>
          {" "}por WhatsApp al{" "}
          <a className="underline" href={waHref(contacto.whatsapp)} target="_blank" rel="noopener">
            {contacto.whatsapp}
          </a>
        </>
      ) : null}
      {contacto.whatsapp && contacto.email ? " o" : ""}
      {contacto.email ? (
        <>
          {" "}a{" "}
          <a className="underline" href={`mailto:${contacto.email}`}>
            {contacto.email}
          </a>
        </>
      ) : null}
      .
    </p>
  );
}

/** Móvil. */
export function ContactoReclamacionesMovil({ contacto }: { contacto: Contacto }) {
  if (!contacto.whatsapp && !contacto.email) return null;
  return (
    <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8, textAlign: "center" }}>
      ¿Dudas o una reclamación? Escríbenos
      {contacto.whatsapp ? (
        <>
          {" "}por WhatsApp al{" "}
          <a style={{ textDecoration: "underline", color: "inherit" }} href={waHref(contacto.whatsapp)} target="_blank" rel="noopener">
            {contacto.whatsapp}
          </a>
        </>
      ) : null}
      {contacto.whatsapp && contacto.email ? " o" : ""}
      {contacto.email ? (
        <>
          {" "}a{" "}
          <a style={{ textDecoration: "underline", color: "inherit" }} href={`mailto:${contacto.email}`}>
            {contacto.email}
          </a>
        </>
      ) : null}
      .
    </p>
  );
}
