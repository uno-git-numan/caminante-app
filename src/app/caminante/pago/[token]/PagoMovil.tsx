"use client";

// Vista MÓVIL de /caminante/pago/<token>. Misma información que el escritorio
// con las primitivas del sitio móvil (`.pub-*`, design/publico-movil/PATRON.md):
// un bloque con el resumen, el total, y el botón «Pagar» en la barra de abajo.

import Link from "next/link";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { pfmt } from "@/app/caminante/ui/pub/PubShell";
import { iniciarPagoDeReserva } from "@/lib/payments/pagina-pago";
import type { PagoVista } from "@/lib/payments/pago-loader";

export default function PagoMovil({ p, error, deslindeHref, wa }: { p: PagoVista; error: string | null; deslindeHref: string | null; wa: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pagando, setPagando] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  // La barra de compra se PORTA a `.pub-app` (su CSS es position:absolute contra
  // ese contenedor); dentro de `.pub-scroll` se iría con el scroll.
  const montar = (el: HTMLSpanElement | null) => {
    if (el && !host) setHost((el.closest(".pub-app") as HTMLElement | null) ?? null);
  };
  const lugares = `${p.personas} ${p.personas === 1 ? "lugar" : "lugares"}`;

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <div className="pub-headpad"></div>
      <span ref={montar} hidden />
      <div className="pub-book" style={{ paddingTop: 18, paddingBottom: p.estado === "pendiente" ? 150 : 40 }}>
        <span className="pub-eyebrow">Tu pago</span>
        <h2 className="pub-display" style={{ fontSize: 28, marginTop: 6 }}>{p.experiencia}</h2>
        {p.salida || p.fechaLarga ? (
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>{[p.salida, p.fechaLarga].filter(Boolean).join(" · ")}</p>
        ) : null}

        {p.estado === "pendiente" ? (
          <>
            <div className="pub-blk" style={{ marginTop: 18 }}>
              <span className="pub-lbl">{p.pila ? `Hola, ${p.pila}` : "Tu lugar"}</span>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                Al pagar apartas {p.personas === 1 ? "tu lugar" : `tus ${lugares}`}. Después firmas tu deslinde y quedas listo para salir.
              </p>
            </div>
            <div className="pub-blk pub-total">
              <span className="pub-lbl">Total</span>
              <div className="row">
                <span>{lugares}</span>
                <span className="pub-mono" style={p.listaMxn ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{pfmt(p.listaMxn ?? p.montoMxn)}</span>
              </div>
              {p.listaMxn ? (
                <div className="row">
                  <span>Tu precio</span>
                  <span className="pub-mono">−{pfmt(p.listaMxn - p.montoMxn)}</span>
                </div>
              ) : null}
              <div className="row tt">
                <span>Total</span>
                <span className="pub-mono">{pfmt(p.montoMxn)} MXN</span>
              </div>
            </div>
            {error ? (
              <p style={{ fontSize: 13.5, color: "var(--orange)", fontWeight: 600, marginTop: 10 }}>{error}</p>
            ) : null}
            <form ref={formRef} action={iniciarPagoDeReserva} onSubmit={() => setPagando(true)}>
              <input type="hidden" name="token" value={p.token} />
            </form>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 14, textAlign: "center" }}>
              Pago seguro con tarjeta vía Stripe. Al terminar vuelves aquí para firmar tu deslinde.
            </p>
          </>
        ) : p.estado === "pagada" ? (
          <div className="pub-blk" style={{ marginTop: 18 }}>
            <div className="pub-state" style={{ padding: "10px 0 4px" }}>
              <span className="ic" style={{ background: "var(--forest)", color: "#fff", fontSize: 22 }}>✓</span>
              <h3>Este pago ya está hecho.</h3>
              <p>Tu lugar está apartado{p.pila ? `, ${p.pila}` : ""}.</p>
              {deslindeHref ? (
                <Link className="pub-cta pub-cta-orange" style={{ width: "auto", padding: "0 24px" }} href={deslindeHref}>
                  Firmar mi deslinde
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="pub-blk" style={{ marginTop: 18 }}>
            <span className="pub-lbl">{p.estado === "cerrada" ? "Esta salida ya cerró ventas" : "Este link ya no está activo"}</span>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)" }}>Escríbenos y lo resolvemos.</p>
            <div className="pub-acts">
              {wa ? (
                <a className="pub-cta pub-cta-orange" href={wa} target="_blank" rel="noopener">
                  Escribir por WhatsApp
                </a>
              ) : null}
              {p.contacto.email ? (
                <a className="pub-cta pub-cta-ghost" href={`mailto:${p.contacto.email}`}>
                  Escribir un correo
                </a>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {p.estado === "pendiente" && host
        ? createPortal(
            <div className="pub-buybar">
              <div className="p">
                <b>{pfmt(p.montoMxn)} MXN</b>
                <small>{[lugares, p.salida].filter(Boolean).join(" · ")}</small>
              </div>
              <button type="button" className="pub-cta pub-cta-orange" disabled={pagando} onClick={() => formRef.current?.requestSubmit()}>
                {pagando ? "Abriendo Stripe…" : "Pagar"}
              </button>
            </div>,
            host,
          )
        : null}
    </div>
  );
}
