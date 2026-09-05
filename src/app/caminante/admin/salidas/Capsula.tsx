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
import { setSlotStatusAction, updateSlot } from "@/lib/admin/eventos-actions";
import {
  reembolsarPersona,
  cancelarSalidaYReembolsar,
  verificarReembolso,
} from "@/lib/payments/reembolsos";
import { iniciales } from "@/lib/admin/formato";
import { mandarmeUnaPrueba } from "@/lib/feedback/prueba";
import { generarLinkDeGrupo } from "@/lib/feedback/link-grupo";

const pct = (a: number, b: number | null) => (b && b > 0 ? Math.min(100, (a / b) * 100) : a > 0 ? 100 : 0);
/** Con coma decimal: es un número que se lee, no un identificador. */
const dec = (n: number) => n.toFixed(1).replace(".", ",");

/** EDITAR SALIDA — cupo, fechas, etiqueta y precio.
 *
 *  ⚠️ Existe porque al sacar las fechas del formulario de experiencia, el
 *  cupo de una salida ya creada se quedó SIN forma de editarse en escritorio:
 *  el teléfono podía y la computadora no. Una capacidad no se pierde al mover
 *  una pantalla de sitio.
 *
 *  Reusa `updateSlot`, la misma acción que llama el panel móvil, con sus dos
 *  guardas del servidor: el cupo nunca por debajo de lo ya vendido, y el fin
 *  nunca antes del inicio. Aquí se avisan antes de mandar, para no hacer ir y
 *  volver al servidor por un error que ya se ve.
 */
function EditarSalida({ s, onListo }: { s: Salida; onListo: () => void }) {
  const [f, setF] = useState({
    etiqueta: s.label,
    ini: s.inicioInput,
    fin: s.finInput,
    cupo: s.cupo != null ? String(s.cupo) : "",
    precio: s.precio != null ? String(s.precio) : "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cupoN = f.cupo.trim() === "" ? null : parseInt(f.cupo.replace(/\D/g, ""), 10);
  const cupoErr = cupoN != null && (Number.isNaN(cupoN) || cupoN < s.personas);
  // El fin dispara la encuesta +24h: invertido le manda «¿cómo te fue?» a
  // gente que todavía no viaja. Ya pasó con una salida de volcanes.
  const finErr = !!f.fin && !!f.ini && f.fin < f.ini;
  const ok = !cupoErr && !finErr && !!f.ini && !!f.etiqueta.trim();

  return (
    <div className="card pad" style={{ marginTop: 14 }}>
      <span className="subtitle">Editar salida</span>
      <div className="mini-form">
        <label className="mut" style={{ fontSize: 12.5 }}>
          Etiqueta{" "}
          <input
            value={f.etiqueta}
            onChange={(e) => setF({ ...f, etiqueta: e.target.value })}
            style={{ width: 150 }}
          />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Inicio{" "}
          <input type="date" value={f.ini} onChange={(e) => setF({ ...f, ini: e.target.value })} />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Fin{" "}
          <input type="date" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Cupo{" "}
          <input
            value={f.cupo}
            onChange={(e) => setF({ ...f, cupo: e.target.value })}
            placeholder="sin tope"
            style={{ width: 90 }}
          />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Precio{" "}
          <input
            value={f.precio}
            onChange={(e) => setF({ ...f, precio: e.target.value })}
            placeholder="el de la experiencia"
            style={{ width: 130 }}
          />
        </label>
      </div>

      {cupoErr ? (
        <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>
          Hay {s.personas} {s.personas === 1 ? "lugar ocupado" : "lugares ocupados"} — el cupo no
          puede quedar abajo de la ocupación.
        </p>
      ) : null}
      {finErr ? (
        <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>
          El fin no puede ser antes del inicio: es lo que dispara la encuesta, y al revés le
          preguntaría «¿cómo te fue?» a quien todavía no viaja.
        </p>
      ) : null}
      {error ? (
        <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>{error}</p>
      ) : null}

      <div className="act-row">
        <button
          type="button"
          className="btn btn-orange"
          disabled={!ok || guardando}
          onClick={async () => {
            setGuardando(true);
            setError("");
            const precioN = f.precio.replace(/\D/g, "");
            const r = await updateSlot({
              slotId: s.id,
              slug: s.slug,
              label: f.etiqueta.trim(),
              // Misma convención que el formulario y que el teléfono: inicio a
              // mediodía UTC y fin a las 23:00 UTC, para que ninguna zona
              // horaria mueva la salida un día.
              startsAt: f.ini ? `${f.ini}T12:00:00.000Z` : undefined,
              endsAt: f.fin ? `${f.fin}T23:00:00.000Z` : null,
              capacityTotal: cupoN,
              priceMxn: precioN ? Number(precioN) : null,
            });
            setGuardando(false);
            if (r?.ok === false) setError(r.error);
            else onListo();
          }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onListo}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

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

const mxn = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

/** DEVOLVER DINERO — una persona, o la salida entera.
 *
 *  ⚠️ Pide MOTIVO y CONFIRMACIÓN escrita, no un `confirm()`. Dos razones: el
 *  diálogo nativo del navegador se auto-cancela en el Chrome automatizado (nos
 *  costó una campaña entera descubrirlo), y sobre todo porque devolver dinero
 *  no se deshace. Escribir el nombre de la salida para cancelarla es la misma
 *  fricción que usa GitHub para borrar un repo, y por el mismo motivo.
 *
 *  El botón NO promete que el dinero ya volvió: se le pide a Stripe, y la
 *  cancelación, el lugar liberado y el correo ocurren cuando Stripe confirma.
 *  El texto lo dice tal cual para que nadie cierre la pantalla creyendo otra cosa.
 */
function Reembolsos({ s, onListo }: { s: Salida; onListo: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const vivos = s.reembolsables.filter((r) => !r.enCurso);
  const totalVivo = vivos.reduce((n, r) => n + r.monto, 0);
  // Comparación TOLERANTE. La etiqueta trae guion largo («Oct 8–11») y nadie lo
  // teclea: escribir «oct 8-11» quedaba fuera y el botón no se habilitaba nunca,
  // sin decir por qué. Se normalizan guiones, acentos y espacios — la
  // confirmación es para frenar un descuido, no para ganar un dictado.
  const plano = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2010-\u2015]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const puedeCancelar = plano(confirmacion) === plano(s.label);

  const contar = (r: { ok: boolean; reembolsados?: number; monto?: number; avisos?: string[]; error?: string }) => {
    if (!r.ok) { setAviso({ ok: false, texto: r.error || "No se pudo." }); return; }
    const base = `Le pedimos a Stripe ${r.reembolsados} ${r.reembolsados === 1 ? "devolución" : "devoluciones"} por ${mxn(r.monto ?? 0)}. En cuanto Stripe confirme se cancela el lugar y sale el correo.`;
    setAviso({ ok: true, texto: [base, ...(r.avisos ?? [])].join(" · ") });
  };

  return (
    <div className="card pad" style={{ marginTop: 14, borderColor: "rgba(179,53,23,.3)" }}>
      <span className="subtitle">Reembolsos</span>
      <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
        Se devuelve por la misma tarjeta. El lugar vuelve a la venta y la persona recibe su correo
        <b> cuando Stripe confirma</b>, no al apretar el botón.
      </p>

      <label className="mut" style={{ fontSize: 12.5, display: "block", marginTop: 12 }}>
        Motivo{" "}
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Se dio de baja · Mal clima · Cupo mínimo no alcanzado"
          style={{ width: "min(420px, 100%)" }}
        />
      </label>

      {s.reembolsables.length === 0 ? (
        <p className="mut" style={{ fontSize: 12.5, marginTop: 12 }}>
          Nadie de esta salida tiene un cobro vivo que devolver.
        </p>
      ) : (
        <div style={{ marginTop: 12 }}>
          {s.reembolsables.map((r) => (
            <div
              key={r.reservationId}
              style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "7px 0" }}
            >
              <span className="av">{iniciales(r.nombre)}</span>
              <span style={{ fontSize: 14 }}>{r.nombre}</span>
              <span className="mut" style={{ fontSize: 12.5 }}>{mxn(r.monto)}</span>
              {r.enCurso ? (
                <>
                  <span className="mut" style={{ fontSize: 12.5 }}>Reembolso en curso</span>
                  {/* Un «en curso» sin salida no es información: es un callejón.
                      Este botón le pregunta a Stripe y cierra lo que falte. */}
                  {r.reembolsoId ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={!!ocupado}
                      onClick={async () => {
                        setOcupado(r.reservationId);
                        setAviso(null);
                        const v = await verificarReembolso(r.reembolsoId!);
                        setAviso(v.ok ? { ok: true, texto: v.mensaje } : { ok: false, texto: v.error });
                        setOcupado("");
                        onListo();
                      }}
                    >
                      {ocupado === r.reservationId ? "Preguntando a Stripe…" : "Verificar con Stripe"}
                    </button>
                  ) : null}
                </>
              ) : !r.porStripe ? (
                <span className="mut" style={{ fontSize: 12.5 }}>Se cobró fuera de Stripe — devuélvelo por banco</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={!!ocupado}
                  onClick={async () => {
                    setOcupado(r.reservationId);
                    setAviso(null);
                    contar(await reembolsarPersona(r.reservationId, motivo));
                    setOcupado("");
                    onListo();
                  }}
                >
                  {ocupado === r.reservationId ? "Pidiendo a Stripe…" : "Reembolsar"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancelar la salida entera. Detrás de la confirmación escrita porque no
          es «lo mismo pero a todos»: además cierra la fecha para siempre. */}
      <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
        <span className="subtitle">Cancelar la salida</span>
        <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
          Devuelve a las {vivos.length} {vivos.length === 1 ? "persona" : "personas"} con cobro vivo
          ({mxn(totalVivo)}), cierra la fecha y avisa a cada quien. <b>No se deshace.</b> Para
          confirmar, escribe la etiqueta de la salida: <b>{s.label}</b>
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
          <input
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            placeholder={s.label}
            style={{ width: "min(260px, 100%)" }}
          />
          <button
            type="button"
            className="btn btn-orange"
            disabled={!puedeCancelar || !!ocupado}
            onClick={async () => {
              setOcupado("salida");
              setAviso(null);
              contar(await cancelarSalidaYReembolsar(s.id, motivo));
              setOcupado("");
              setConfirmacion("");
              onListo();
            }}
          >
            {ocupado === "salida" ? "Cancelando…" : "Cancelar salida y reembolsar a todos"}
          </button>
          {!puedeCancelar ? (
            <span className="mut" style={{ fontSize: 12.5 }}>
              Escribe <b>{s.label}</b> para habilitarlo.
            </span>
          ) : null}
        </div>
      </div>

      {aviso ? (
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.6,
            marginTop: 12,
            color: aviso.ok ? "var(--olive)" : "#b33517",
          }}
        >
          {aviso.texto}
        </p>
      ) : null}
    </div>
  );
}

export default function Capsula({ s, sitio, esCasa = false }: { s: Salida; sitio: string; esCasa?: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [reembolsando, setReembolsando] = useState(false);
  const [tokenGrupo, setTokenGrupo] = useState(s.tokenGrupo);
  const [generando, setGenerando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [prueba, setPrueba] = useState("");
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

              {/* «Nadie recibió» solo si de verdad no se mandó. Antes esta línea
                  aparecía cuando NADIE HABÍA RESPONDIDO, sobre siete correos ya
                  entregados: el tablero afirmaba lo contrario de lo que pasaba y
                  mandó a perseguir un bug que no existía. */}
              {s.invitadas === 0 ? (
                <div className="empty" style={{ border: 0 }}>
                  A nadie de esta salida se le mandó la encuesta.
                </div>
              ) : !s.respondieron.length ? (
                <div className="empty" style={{ border: 0 }}>
                  Encuesta enviada a {s.invitadas}{" "}
                  {s.invitadas === 1 ? "persona" : "personas"} · nadie ha respondido todavía.
                  Mándales el link de abajo por WhatsApp.
                </div>
              ) : null}

              <div className="salfoot">
                {/* EL LINK, SIEMPRE A LA MANO. Antes solo aparecía si la salida
                    ya tenía token, y las salidas viejas no lo tienen: quedaba una
                    pantalla que decía «nadie respondió» sin ofrecer con qué
                    arreglarlo. Ahora, si falta, se genera de un clic. */}
                {tokenGrupo ? (
                  <div className="sallk">
                    <span>{`${sitio}/caminante/feedback/salida/${tokenGrupo}`}</span>
                    <LinkDeslinde
                      link={`${sitio}/caminante/feedback/salida/${tokenGrupo}`}
                      telefono={null}
                      nombre=""
                      experiencia={s.experiencia}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={generando}
                    onClick={async () => {
                      setGenerando(true);
                      const r = await generarLinkDeGrupo(s.id);
                      if (r.ok) setTokenGrupo(r.token);
                      setGenerando(false);
                    }}
                  >
                    {generando ? "Generando…" : "Generar link de la encuesta"}
                  </button>
                )}
                {/* Prueba SEGURA: no recibe destinatario, va a tu propio correo.
                    Ver lib/feedback/prueba.ts — nació de mandarle dos duplicados
                    a una clienta por apretar el renglón equivocado. */}
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={probando}
                  onClick={async () => {
                    setProbando(true);
                    const r = await mandarmeUnaPrueba(s.experienceId);
                    setPrueba(r.ok ? `Prueba enviada a ${r.a}` : r.error);
                    setProbando(false);
                  }}
                >
                  {probando ? "Mandando…" : "Mandarme una prueba a mí"}
                </button>
                {prueba ? (
                  <span className="mut" style={{ fontSize: 12.5 }}>{prueba}</span>
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
                {/* Cerrar deja de VENDER, no borra: la fecha, sus reservas y su
                    roster siguen enteros. Vive aquí y ya no en la ficha de la
                    experiencia, para que todo lo que le pasa a una salida pase
                    en un solo lugar. */}
                <form action={setSlotStatusAction} style={{ display: "inline" }}>
                  <input type="hidden" name="slotId" value={s.id} />
                  <input type="hidden" name="slug" value={s.slug} />
                  <input type="hidden" name="status" value={s.estado === "open" ? "closed" : "open"} />
                        <button type="submit" className="btn btn-ghost">
                    {s.estado === "open" ? "Cerrar ventas" : "Reabrir ventas"}
                  </button>
                </form>
                {/* Editar vive AQUÍ porque aquí vive la salida. Al sacar las
                    fechas del formulario de experiencia, el cupo de una salida
                    ya creada se quedó sin forma de editarse en escritorio: el
                    teléfono podía y la computadora no. */}
                {s.pasada ? null : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditando((v) => !v)}
                  >
                    {editando ? "Cerrar edición" : "Editar cupo y fechas"}
                  </button>
                )}
                {/* Dinero. Solo aparece para la casa: `reembolsables` llega
                    vacío para un operador (la devolución sale de la cuenta de
                    NUMAN HUB, no de la suya). */}
                {esCasa ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setReembolsando((v) => !v)}
                  >
                    {reembolsando ? "Cerrar reembolsos" : "Reembolsar o cancelar"}
                  </button>
                ) : null}
                {s.estado !== "open" ? (
                  <span className="mut" style={{ fontSize: 12.5 }}>
                    Ya no se vende. La fecha y su gente siguen aquí.
                  </span>
                ) : null}
              </div>
              {editando ? <EditarSalida s={s} onListo={() => setEditando(false)} /> : null}
              {reembolsando ? <Reembolsos s={s} onListo={() => setReembolsando(false)} /> : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
