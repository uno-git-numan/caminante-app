"use client";

// LA CÁPSULA DE UNA SALIDA. Transcrita del entregable de Claude Design
// (design/encuesta-v2/dc/salidas.dc.html); las clases `.sal*` viven en
// admin-css.ts, extraídas verbatim de ahí.
//
// Cerrada tiene que poder barrerse en un segundo: si todo está en orden, no debe
// pedir atención. Abierta puede ser densa.
//
// Es cliente solo por el acordeón y por copiar el link. Los datos ya vienen
// resueltos del servidor (`fetchSalidas`); aquí no se consulta ni se calcula.

import { useState } from "react";
import type { Salida } from "@/lib/admin/salidas";
import LinkDeslinde from "@/app/caminante/admin/encuesta/LinkDeslinde";
import { reenviarEncuesta } from "@/lib/feedback/resend-actions";

// ⚠️ Vive aquí y no en lib/admin/salidas.ts a propósito: ese módulo llega hasta
// next/headers por la cadena del alcance, y un componente CLIENTE que lo
// importe —aunque sea por una función de una línea— rompe el build. El tipo sí
// viaja gratis, con `import type`, que se borra al compilar.
const iniciales = (n: string) =>
  n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";

const pct = (a: number, b: number | null) => (b && b > 0 ? Math.min(100, (a / b) * 100) : a > 0 ? 100 : 0);
/** Con coma decimal: es un número que se lee, no un identificador. */
const dec = (n: number) => n.toFixed(1).replace(".", ",");

function Barra({ etiqueta, hecho, total, warn }: { etiqueta: string; hecho: number; total: number | null; warn?: boolean }) {
  return (
    <div className="progrow">
      <span className="mut">{etiqueta}</span>
      <div className={`prog${warn ? " warn" : ""}`}>
        <div className="tk2">
          <i style={{ width: `${pct(hecho, total)}%` }} />
        </div>
        <span className="fr">
          {hecho}/{total ?? "∞"}
        </span>
      </div>
    </div>
  );
}

export default function Capsula({ s, sitio }: { s: Salida; sitio: string }) {
  const [abierta, setAbierta] = useState(false);
  const faltan = s.titulares - s.firmados;
  // «Grave» se reserva para la salida que va a viajar sin encuesta: si viaja
  // así, no hay forma de saber cómo estuvo, y el único síntoma es el silencio.
  // Ya pasó — hongos, 26 jul, 18 personas.
  const grave = !s.pasada && !s.encuestaArmada;
  const alerta = !s.pasada && faltan > 0;

  return (
    <article className={`card salcard${grave ? " grave" : alerta ? " alerta" : ""}`}>
      <div className="pad xhead" onClick={() => setAbierta((v) => !v)} style={{ cursor: "pointer" }}>
        <div className="saltop">
          <div className="g">
            <h3>
              {s.experiencia} <span className="chev2" style={{ transform: abierta ? "rotate(180deg)" : undefined }}>▾</span>
            </h3>
            <p className="meta">
              {[s.label, s.lugar, s.operador ? `operada por ${s.operador}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span className={`salwhen${s.cerca ? " cerca" : ""}`}>{s.cuando}</span>
        </div>

        {s.pasada ? (
          <>
            <div className="salmtr">
              <div>
                <div className="v">
                  {s.stars != null ? dec(s.stars) : "—"}
                  <span className="st"> ★</span>
                </div>
                {/* ⚠️ El promedio NUNCA va solo: su denominador vive pegado. */}
                <div className="d">
                  promedio de <b>{s.respuestas}</b> {s.respuestas === 1 ? "respuesta" : "respuestas"}
                </div>
              </div>
              <div>
                <div className="v">
                  {s.nps != null ? (s.nps > 0 ? `+${s.nps}` : s.nps) : "—"}
                  <span className="u"> NPS</span>
                </div>
                <div className="d">
                  {s.promotores} promotores · {s.pasivos} pasivos · {s.detractores} detractores
                </div>
              </div>
              <div>
                <div className="v">
                  {s.invitadas ? Math.round((s.respuestas / s.invitadas) * 100) : 0}
                  <span className="u">%</span>
                </div>
                <div className="d">
                  <b>
                    {s.respuestas} de {s.invitadas}
                  </b>{" "}
                  respondieron
                </div>
              </div>
            </div>
            <div className="salsig">
              {s.peor ? (
                <span className="pend">
                  <s>↓</s>Lo más bajo: {s.peor.label} ({dec(s.peor.stars)})
                </span>
              ) : null}
              {s.publicables ? (
                <span className="ok">
                  <s>✎</s>
                  {s.publicables} {s.publicables === 1 ? "testimonio listo" : "testimonios listos"} para publicar
                </span>
              ) : null}
              {s.repiten ? (
                <span className="ok">
                  <s>↻</s>
                  {s.repiten} {s.repiten === 1 ? "quiere" : "quieren"} repetir
                </span>
              ) : null}
              {s.queFalto ? (
                <span className="pend">
                  <s>{"//"}</s>1 dijo qué faltó
                </span>
              ) : null}
              {s.sinResponder.length ? (
                <span className="pend">
                  <s>·</s>
                  {s.sinResponder.length} {s.sinResponder.length === 1 ? "falta" : "faltan"} de responder
                </span>
              ) : null}
              {!s.respuestas && !s.sinResponder.length ? (
                <span className="pend">
                  <s>·</s>Nadie recibió la encuesta
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="salbars">
              <Barra etiqueta="Lugares" hecho={s.personas} total={s.cupo} />
              <Barra etiqueta="Deslindes" hecho={s.firmados} total={s.titulares} warn={faltan > 0} />
            </div>
            <div className="salsig">
              {faltan > 0 ? (
                <span className={s.cerca ? "crit" : "pend"}>
                  <s>⚠</s>
                  {faltan} {faltan === 1 ? "persona sin firmar" : "personas sin firmar"}
                  {s.cerca ? `, y la salida es ${s.cuando.toLowerCase()}` : ""}
                </span>
              ) : (
                <span className="ok">
                  <s>✓</s>Todos firmaron
                </span>
              )}
              {s.encuestaArmada ? (
                <span className="ok">
                  <s>✓</s>Encuesta armada
                </span>
              ) : (
                <span className="crit">
                  <s>⚠</s>Va a viajar sin encuesta: no habrá cómo saber cómo estuvo
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`xbody${abierta ? " on" : ""}`}>
        <div className="pad" style={{ paddingTop: 0 }}>
          {s.pasada ? (
            <>
              {s.queFalto ? (
                <p className="salsay">
                  «{s.queFalto.texto}»<small>Qué faltó · {s.queFalto.autor}</small>
                </p>
              ) : null}
              {s.respondieron.length ? (
                <>
                  <div className="xh4">Respondieron · {s.respondieron.length}</div>
                  {s.respondieron.map((r, i) => (
                    <div className="salper" key={i}>
                      <span className="av">{iniciales(r.nombre)}</span>
                      <span className="nm">
                        {r.nombre}
                        {r.texto ? <span className="tx">«{r.texto}»</span> : null}
                        {r.sinReserva ? <small>entró por el link de grupo, sin reserva</small> : null}
                      </span>
                      <span className="rt">
                        <span className="qz">
                          <span className="s">★</span> {r.stars ?? "—"}
                          {r.nps != null ? ` · NPS ${r.nps}` : ""}
                        </span>
                        {r.publicable ? (
                          <span className="chip c-pub">
                            <span className="cd" style={{ background: "var(--olive)" }} />
                            Publicable
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </>
              ) : null}

              {/* Perseguir al que NO respondió es la mitad del trabajo, igual
                  que con las firmas. Mismas tres acciones: correo, copiar el
                  link, y WhatsApp cuando hay teléfono — porque el correo no
                  siempre llega y una encuesta sin respuestas no mide nada. */}
              {s.sinResponder.length ? (
                <>
                  <div className="xh4">Faltan por responder · {s.sinResponder.length}</div>
                  {s.sinResponder.map((p) => (
                    <div className="salper" key={p.feedbackId}>
                      <span className="av">{iniciales(p.nombre)}</span>
                      <span className="nm">
                        {p.nombre}
                        <small>{[p.email, p.telefono || "sin teléfono"].filter(Boolean).join(" · ")}</small>
                      </span>
                      <span className="rt">
                        <span className="st">Sin responder</span>
                        {p.email ? (
                          <form action={reenviarEncuesta} style={{ display: "inline" }}>
                            <input type="hidden" name="feedbackId" value={p.feedbackId} />
                            <button
                              type="submit"
                              className="btn btn-glass btn-sm"
                              style={{ padding: "3px 9px", fontSize: 11.5 }}
                              title={`Reenviar la encuesta a ${p.email}`}
                            >
                              ✉ Recordar
                            </button>
                          </form>
                        ) : null}
                        {p.token ? (
                          <LinkDeslinde
                            tipo="encuesta"
                            link={`${sitio}/caminante/feedback/${p.token}`}
                            telefono={p.telefono}
                            nombre={p.nombre}
                            experiencia={s.experiencia}
                          />
                        ) : null}
                      </span>
                    </div>
                  ))}
                </>
              ) : null}

              {!s.respondieron.length && !s.sinResponder.length ? (
                <div className="empty" style={{ border: 0 }}>
                  A nadie de esta salida se le mandó la encuesta.
                </div>
              ) : null}

              <div className="salfoot">
                {s.tokenGrupo ? (
                  <div className="sallk">
                    <span>{`${sitio}/caminante/feedback/salida/${s.tokenGrupo}`}</span>
                    <LinkDeslinde
                      link={`${sitio}/caminante/feedback/salida/${s.tokenGrupo}`}
                      telefono={null}
                      nombre=""
                      experiencia={s.experiencia}
                    />
                  </div>
                ) : null}
                <a href={`/caminante/admin/roster/${s.id}`} className="btn btn-ghost">
                  Ver roster
                </a>
              </div>
            </>
          ) : (
            <>
              {s.pendientes.length ? (
                <>
                  <div className="xh4">Faltan por firmar · {s.pendientes.length}</div>
                  {s.pendientes.map((p) => (
                    <div className="salper" key={p.reservationId}>
                      <span className="av">{iniciales(p.nombre)}</span>
                      <span className="nm">
                        {p.nombre}
                        <small>{[p.email, p.telefono || "sin teléfono"].filter(Boolean).join(" · ")}</small>
                      </span>
                      <span className="rt">
                        <span className="st">Pendiente</span>
                        <LinkDeslinde
                          link={`${sitio}/caminante/registro/${s.slug}?reserva=${p.reservationId}`}
                          telefono={p.telefono}
                          nombre={p.nombre}
                          experiencia={s.experiencia}
                        />
                      </span>
                    </div>
                  ))}
                </>
              ) : null}
              {s.firmadosLista.length ? (
                <>
                  <div className="xh4">Firmaron · {s.firmadosLista.length}</div>
                  <div className="pchips">
                    {s.firmadosLista.map((f, i) => (
                      <span className="pchip ok" key={i}>
                        <span className="av">{iniciales(f.nombre)}</span>
                        {f.nombre}
                        <span className="dt">{f.fecha}</span>
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
              <div className="salfoot">
                <a href={`/caminante/admin/roster/${s.id}`} className="btn btn-ghost">
                  Ver roster
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
