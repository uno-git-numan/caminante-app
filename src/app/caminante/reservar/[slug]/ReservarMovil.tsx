"use client";

// Vista MÓVIL de /caminante/reservar/[slug] — transcripción de `PubReservar`
// (design/publico-movil/pub-b.jsx:4) contra el flujo de cobro real.
//
// La ruta YA tiene escritorio (CheckoutForm): `page.tsx` renderiza los DOS
// marcados y el CSS decide cuál se ve (corte en 700px). Aquí solo vive el móvil.
//
// ⚠️ LA DIFERENCIA QUE NO PUEDE VIVIR DENTRO DE LA APP: en la demo el botón
// «Pagar» espera con un `setTimeout` y enseña la pantalla de éxito. En vivo
// `createCheckout` (src/lib/payments/checkout.ts, INTOCADO) crea la Checkout
// Session y **redirige a Stripe**; el regreso aterriza en
// /caminante/reserva/exito?session_id=. Por eso el marcado es el mismo y lo
// único que cambia es que el botón de la barra de compra dispara la server
// action de hoy — con los mismos campos que manda el escritorio (slug, slotId,
// numPeople, tierIndex y el token de grupo, que el servidor revalida).
//
// Lo que se conserva del flujo vivo, porque es lo que hace que la venta sea
// correcta: cupo real por salida, niveles de precio (`priceTiers`, el monto lo
// resuelve el servidor por índice), token de grupo `?grupo=` (solo se ve esa
// salida) y el gate de deslinde (`deslindeListo`): sin deslinde completo no hay
// formulario, hay aviso.

import { useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { NavCream } from "@/app/caminante/ui/pub/atoms";
import { pfmt } from "@/app/caminante/ui/pub/PubShell";
import { createCheckout } from "@/lib/payments/checkout";
import { trackPixel } from "@/lib/meta/pixel";
import type { PriceTier, ReservarComplemento, ReservarSlot } from "./CheckoutForm";

// Parseo del monto del nivel — mismo criterio que `parseMxnAmount` del server
// (el monto de verdad lo resuelve `createCheckout` por índice; esto es display).
const parseTier = (a: string): number => {
  const n = Number(String(a).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function disponible(s: ReservarSlot): string {
  if (s.soldOut) return "agotada — pide otra fecha abajo";
  if (s.available === null) return "lugares disponibles";
  if (s.available <= 3) return `quedan ${s.available} lugares`;
  return `${s.available} lugares`;
}

export default function ReservarMovil({
  slug,
  titulo,
  lugar,
  slots,
  tiers,
  complementos,
  grupoToken,
  deslindeOk,
  errMsg,
}: {
  slug: string;
  titulo: string;
  lugar: string;
  slots: ReservarSlot[];
  tiers: PriceTier[];
  complementos: ReservarComplemento[];
  grupoToken?: string | null;
  /** `deslindeListo(exp).ok` — sin él NO se cobra (regla que nació del caso Enyd). */
  deslindeOk: boolean;
  errMsg: string | null;
}) {
  const primero = slots.find((s) => !s.soldOut) ?? slots[0];
  const [sel, setSel] = useState(primero?.id ?? "");
  const [pax, setPax] = useState(1);
  const [nivel, setNivel] = useState(tiers.length ? 0 : -1);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [pagando, setPagando] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // La barra de compra se PORTA a `.pub-app` (su CSS es position:absolute contra
  // ese contenedor); dentro de `.pub-scroll` se iría con el scroll.
  const montar = (el: HTMLSpanElement | null) => {
    if (el && !host) setHost((el.closest(".pub-app") as HTMLElement | null) ?? null);
  };

  const salida = slots.find((s) => s.id === sel) ?? primero;
  const maxPax = salida?.available != null ? Math.max(1, Math.min(salida.available, 12)) : 12;
  const ppl = Math.min(pax, maxPax);
  const precio = tiers.length && nivel >= 0 ? parseTier(tiers[nivel].amount) : (salida?.perPerson ?? 0);

  // Agregables de ESTA salida. Los obligatorios entran solos.
  const agregables = complementos.filter((c) => c.slotId === null || c.slotId === sel);
  const puestos = agregables.filter((c) => c.obligatorio || marcados.includes(c.id));
  const extra = puestos.reduce((n, c) => n + c.precioUnitario * (c.porPersona ? ppl : 1), 0);
  const total = precio * ppl + extra;

  const backHref = `/caminante/experiencias/${slug}${grupoToken ? `?grupo=${grupoToken}` : ""}`;

  // --- pantallas que NO son el formulario (mismas reglas que el escritorio) ---
  const aviso = !deslindeOk ? (
    <div className="pub-book" style={{ paddingTop: 14 }}>
      <div className="pub-blk">
        <span className="pub-lbl">Todavía no abre</span>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)" }}>
          Estamos terminando de preparar esta experiencia — la reserva en línea aún no está
          abierta.
        </p>
        <div className="pub-acts">
          <a className="pub-cta pub-cta-ghost" href="mailto:uno@numanhub.com">
            Escríbenos y te avisamos
          </a>
        </div>
      </div>
    </div>
  ) : slots.length === 0 ? (
    <div className="pub-book" style={{ paddingTop: 14 }}>
      <div className="pub-blk">
        <div className="pub-state" style={{ padding: "10px 0 4px" }}>
          <h3>No hay salidas abiertas</h3>
          <p>Puedes pedir la tuya y abrimos una fecha para tu grupo.</p>
          <Link
            className="pub-cta pub-cta-orange"
            style={{ width: "auto", padding: "0 24px" }}
            href={`/caminante/solicitar/${slug}`}
          >
            Solicitar mi fecha
          </Link>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <span ref={montar} hidden />
      <NavCream t={`Reservar · ${titulo}`} s={lugar} backHref={backHref} />

      {errMsg ? (
        <div
          className="pub-blk"
          style={{ margin: "14px 20px 0", borderColor: "rgba(255,93,54,.4)", borderWidth: 1.5 }}
        >
          <span className="pub-lbl" style={{ color: "var(--orange)" }}>
            Revisa esto
          </span>
          <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{errMsg}</p>
        </div>
      ) : null}

      {grupoToken ? (
        <div style={{ margin: "14px 20px 0" }} className="pub-blk">
          <span className="pub-lbl" style={{ marginBottom: 4 }}>
            Salida privada
          </span>
          <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Llegaste por el link de tu grupo: solo ves esta salida. El resto del calendario no
            aplica aquí.
          </p>
        </div>
      ) : null}

      {aviso ?? (
        <form
          ref={formRef}
          action={createCheckout}
          onSubmit={() => {
            setPagando(true);
            trackPixel("InitiateCheckout", {
              content_ids: [slug],
              content_type: "product",
              value: total,
              currency: "MXN",
              num_items: ppl,
            });
          }}
        >
          {/* El monto NUNCA viaja desde el cliente: el servidor lo resuelve por índice. */}
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="slotId" value={sel} />
          <input type="hidden" name="numPeople" value={ppl} />
          {tiers.length ? <input type="hidden" name="tierIndex" value={nivel} /> : null}
          {grupoToken ? <input type="hidden" name="grupo" value={grupoToken} /> : null}
          {puestos.map((c) => (
            <input key={c.id} type="hidden" name="complemento" value={c.id} />
          ))}

          <div className="pub-book" style={{ paddingTop: 14, paddingBottom: 150 }}>
            <div className="pub-blk">
              <span className="pub-lbl">Elige tu salida</span>
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={"pub-sel" + (sel === s.id ? " on" : "") + (s.soldOut ? " off" : "")}
                  disabled={s.soldOut}
                  onClick={() => {
                    setSel(s.id);
                    if (s.available != null && pax > s.available) setPax(Math.max(1, s.available));
                  }}
                >
                  <span className="rd">{sel === s.id ? <i></i> : null}</span>
                  <div className="g">
                    <b>{s.label}</b>
                    <small>{disponible(s)}</small>
                  </div>
                  <span className="pr">{pfmt(tiers.length ? precio : s.perPerson)}</span>
                </button>
              ))}
              {grupoToken ? null : (
                <Link
                  className="pub-cta pub-cta-ghost pub-cta-sm"
                  style={{ width: "100%", marginTop: 10 }}
                  href={`/caminante/solicitar/${slug}`}
                >
                  ¿Ninguna te sirve? Solicita tu fecha
                </Link>
              )}
            </div>

            {tiers.length ? (
              <div className="pub-blk">
                <span className="pub-lbl">Nivel</span>
                {tiers.map((t, i) => (
                  <button
                    type="button"
                    key={t.label}
                    className={"pub-sel" + (nivel === i ? " on" : "")}
                    onClick={() => setNivel(i)}
                  >
                    <span className="rd">{nivel === i ? <i></i> : null}</span>
                    <div className="g">
                      <b>{t.label}</b>
                    </div>
                    <span className="pr">{pfmt(parseTier(t.amount))}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {agregables.length ? (
              <div className="pub-blk">
                <span className="pub-lbl">Agrega a tu viaje</span>
                {agregables.map((c) => {
                  const on = c.obligatorio || marcados.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      className={"pub-sel" + (on ? " on" : "")}
                      disabled={c.obligatorio}
                      onClick={() =>
                        setMarcados((m) =>
                          m.includes(c.id) ? m.filter((x) => x !== c.id) : [...m, c.id],
                        )
                      }
                    >
                      <span className="rd">{on ? <i></i> : null}</span>
                      <div className="g">
                        <b>{c.nombre}</b>
                        {/* Un solo <small>: `.pub-sel .g small` es inline, dos
                            renglones se pegarían en la misma línea. */}
                        {c.descripcion || c.obligatorio ? (
                          <small>
                            {[c.descripcion, c.obligatorio ? "Incluido siempre" : ""]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        ) : null}
                      </div>
                      <span className="pr">
                        + {pfmt(c.precioUnitario * (c.porPersona ? ppl : 1))}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="pub-blk">
              <span className="pub-lbl">Personas</span>
              <div className="pub-stepper">
                <button type="button" aria-label="Quitar" onClick={() => setPax(Math.max(1, ppl - 1))}>
                  −
                </button>
                <b>{ppl}</b>
                <button
                  type="button"
                  aria-label="Agregar"
                  onClick={() => setPax(Math.min(maxPax, ppl + 1))}
                >
                  +
                </button>
                <small>Los acompañantes se registran al firmar el deslinde</small>
              </div>
              {salida?.available != null && ppl === salida.available ? (
                <p style={{ fontSize: 13.5, color: "var(--orange)", fontWeight: 600, marginTop: 8 }}>
                  Son los últimos {salida.available} lugares de esta salida.
                </p>
              ) : null}
            </div>

            <div className="pub-blk pub-total">
              <span className="pub-lbl">Total</span>
              <div className="row">
                <span>
                  {ppl} × {pfmt(precio)}
                </span>
                <span className="pub-mono">{pfmt(total)}</span>
              </div>
              {puestos.map((c) => (
                <div className="row" key={c.id}>
                  <span>{c.nombre}</span>
                  <span className="pub-mono">
                    {pfmt(c.precioUnitario * (c.porPersona ? ppl : 1))}
                  </span>
                </div>
              ))}
              <div className="row">
                <span>IVA incluido</span>
                <span className="pub-mono">—</span>
              </div>
              <div className="row tt">
                <span>Total</span>
                <span className="pub-mono">{pfmt(total)} MXN</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {host && !aviso
        ? createPortal(
            <div className="pub-buybar">
              <div className="p">
                <b>{pfmt(total)} MXN</b>
                <small>
                  {ppl} persona{ppl > 1 ? "s" : ""} · {salida?.label ?? ""}
                </small>
              </div>
              <button
                type="button"
                className="pub-cta pub-cta-orange"
                disabled={!salida || salida.soldOut || pagando}
                onClick={() => formRef.current?.requestSubmit()}
              >
                {pagando ? "Abriendo Stripe…" : "Pagar"}
              </button>
            </div>,
            host,
          )
        : null}
    </div>
  );
}
