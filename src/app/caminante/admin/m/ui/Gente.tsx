"use client";

// GENTE en el teléfono — transcrita de `ScrGente`, `ScrPersona`, `ScrRoster`,
// `ScrEncuesta` y sus hojas/diálogos (design/admin-movil/adm-screens-b.jsx).
// Markup y clases 1:1; los datos salen de `lib/admin/movil/gente.ts`, que reusa
// las queries del panel de escritorio.
//
// Lo que el prototipo traía escrito a mano y aquí NO se inventa:
//   · «Anticipo 50%» → el porcentaje real de lo pagado, y solo si hay anticipo.
//   · «Lista guardada a las 6:40 — funciona sin señal» → el roster no tiene
//     caché offline. Lo único que se guarda en el teléfono es el palomeo de
//     abordaje, y el aviso lo dice tal cual.
//   · Los toasts de «Imprimir» y «CSV» → hoy son las dos salidas admin-gated
//     que ya existían en el escritorio.
//
// ⚠️ DATOS MÉDICOS (LFPDPPP): el roster y la ficha los muestran porque el guía
// los necesita en campo. No hay botón de copiar ni de compartir sobre ellos y
// nada de esto viaja a Notion.

import { useCallback, useEffect, useState } from "react";
import type { Nav, Ui } from "./AppShell";
import { Chip, Empty, Fld, Gap, Head, NavBar, Seg, Sub, CopyBox, fmt } from "./kit";
import type { GenteMovil, PersonaMovil, ReservaMovil, RosterMovil } from "@/lib/admin/movil/gente";
import {
  cancelarReservaMovil,
  cargarRoster,
  decidirTestimonio,
  recordarFirma,
  recordarFirmaATodos,
  reenviarEncuestaExperiencia,
  reenviarEncuestaPendientesTodas,
  registrarPago,
} from "@/lib/admin/movil/gente-acciones";

/* ── GENTE (raíz con segmentos) ── */
export default function Gente({ d, nav, ui }: { d: GenteMovil; nav: Nav; ui: Ui }) {
  const [seg, setSeg] = useState("Reservas");
  return (
    <div className="adm-screen">
      <Head eyebrow="Gente" title="Quién <em>viene.</em>" />
      <div className="adm-pad">
        <Seg
          opts={["Reservas", "Personas", "Encuesta"]}
          val={seg}
          set={(v) => {
            if (v === "Encuesta") {
              nav.push("encuesta");
            } else setSeg(v);
          }}
        />
        <Gap />
        {seg === "Reservas" && <GenteReservas d={d} ui={ui} nav={nav} />}
        {seg === "Personas" && <GentePersonas d={d} nav={nav} />}
      </div>
    </div>
  );
}

const FILTROS = ["Todas", "Pagadas", "Confirmadas", "Pendientes", "Canceladas"] as const;
const GRUPO_DE: Record<string, string> = {
  Pagadas: "pagada",
  Confirmadas: "confirmada",
  Pendientes: "pendiente",
  Canceladas: "cancelada",
};

function GenteReservas({ d, ui, nav }: { d: GenteMovil; ui: Ui; nav: Nav }) {
  const [filtro, setFiltro] = useState<string>("Todas");
  const list = d.reservas.filter((r) => filtro === "Todas" || r.grupo === GRUPO_DE[filtro]);
  const chipDe = (r: ReservaMovil) => (
    <Chip c={r.chip} dot={r.chip === "ok"}>
      {r.pctPagado != null ? `${r.estadoLabel} ${r.pctPagado}%` : r.estadoLabel}
    </Chip>
  );
  return (
    <div>
      <div className="adm-filters">
        {FILTROS.map((f) => (
          <button
            key={f}
            className={"adm-btn adm-btn-sm " + (filtro === f ? "adm-btn-forest" : "adm-btn-ghost")}
            onClick={() => setFiltro(f)}
          >
            {f}
            {f === "Todas" ? " · " + d.reservas.length : ""}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="adm-card">
          <Empty ic="◌" t={"Sin reservas " + filtro.toLowerCase()} p="Cuando exista una, aparece aquí." />
        </div>
      ) : (
        <div className="adm-card">
          {list.map((r) => (
            <details className="adm-li" key={r.id}>
              <summary>
                <div className="r1">
                  <span className="t">
                    {r.persona}
                    <small>
                      {r.expLabel} · {r.pax} persona{r.pax > 1 ? "s" : ""}
                    </small>
                  </span>
                  <span className={"m adm-mono" + (r.debe > 0 && r.grupo !== "cancelada" ? " neg" : "")}>
                    {/* Total en cero = cobrada fuera del sistema, no gratis. Lo
                        dice con guion, igual que el panel de escritorio. */}
                    {r.grupo === "cancelada"
                      ? "—"
                      : r.debe > 0
                        ? r.pagado > 0
                          ? "debe " + fmt(r.debe)
                          : "sin pago"
                        : r.total > 0
                          ? fmt(r.total)
                          : "—"}
                  </span>
                </div>
                <div className="r2">
                  {chipDe(r)}
                  {r.deslindePendiente && <Chip c="warn">Deslinde pendiente</Chip>}
                  <span className="dt">{r.canal}</span>
                </div>
              </summary>
              <div className="adm-x">
                <div className="adm-acts">
                  {r.operable && (
                    <button
                      className="adm-btn adm-btn-orange"
                      onClick={() => ui.openSheet("regPago", { reservationId: r.id })}
                    >
                      Registrar pago
                    </button>
                  )}
                  <button
                    className="adm-btn adm-btn-ghost"
                    onClick={() => nav.push("persona", { contactId: r.contactId })}
                  >
                    Expediente
                  </button>
                  {r.deslindePendiente && (
                    <button
                      className="adm-btn adm-btn-ghost"
                      onClick={() =>
                        ui.openDialog("recordarFirma", {
                          tipo: "una",
                          reservationId: r.id,
                          quien: r.persona,
                          deslindeUrl: r.deslindeUrl || "",
                        })
                      }
                    >
                      Recordar firma
                    </button>
                  )}
                  {r.operable && (
                    <button
                      className="adm-btn adm-btn-danger"
                      onClick={() => ui.openDialog("cancelarReserva", { reservationId: r.id })}
                    >
                      Cancelar reserva
                    </button>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function GentePersonas({ d, nav }: { d: GenteMovil; nav: Nav }) {
  if (!d.personas.length) {
    return (
      <div className="adm-card">
        <Empty ic="◌" t="Todavía nadie" p="Cada reserva y cada firma da de alta a su persona aquí." />
      </div>
    );
  }
  return (
    <div className="adm-card">
      {d.personas.map((p) => (
        <div
          className="adm-ros"
          key={p.id}
          onClick={() => nav.push("persona", { contactId: p.id })}
          style={{ cursor: "pointer" }}
        >
          <span className="adm-av">{p.ini}</span>
          <span className="nm">
            {p.nombre}
            <small>
              {p.viajes} {p.viajes === 1 ? "reserva" : "reservas"}
              {p.desde ? ` · desde ${p.desde}` : ""}
            </small>
          </span>
          <Chip c={p.tagTono}>{p.tag}</Chip>
        </div>
      ))}
    </div>
  );
}

/* ── Ficha de una persona ── */
export function Persona({
  d,
  nav,
  params,
}: {
  d: GenteMovil;
  nav: Nav;
  params: Record<string, string>;
}) {
  const p: PersonaMovil | undefined = d.personas.find((x) => x.id === params.contactId);
  if (!p) {
    return (
      <div className="adm-screen">
        <NavBar onBack={nav.pop} t="Expediente" s="" />
        <div className="adm-pad">
          <div className="adm-card">
            <Empty ic="◌" t="Ya no está" p="Esa persona no aparece en la lista; vuelve a abrirla desde Gente." />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="adm-screen">
      <NavBar
        onBack={nav.pop}
        t={p.nombre}
        s={
          (p.desde ? `desde ${p.desde} · ` : "") +
          `${p.viajes} ${p.viajes === 1 ? "reserva" : "reservas"}`
        }
      />
      <div className="adm-pad">
        <div className="adm-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <span className="adm-av" style={{ width: 46, height: 46, fontSize: 15 }}>
            {p.ini}
          </span>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 16 }}>{p.nombre}</b>
            <br />
            <span className="adm-mut" style={{ fontSize: 12.5 }}>
              {[p.email, p.telefono].filter(Boolean).join(" · ") || "sin contacto capturado"}
            </span>
          </div>
          <span className="adm-mono" style={{ fontSize: 17 }}>
            {fmt(p.total)}
          </span>
        </div>
        <Gap />
        <Sub pad>Sus reservas</Sub>
        <div className="adm-card">
          {p.reservas.length === 0 ? (
            <Empty ic="◌" t="Sin reservas" p="Todavía no reserva ninguna salida." />
          ) : (
            p.reservas.map((r, i) => (
              <div className="adm-li" key={i}>
                <div className="rowbody">
                  <div className="r1">
                    <span className="t">
                      {r.expLabel}
                      <small>
                        {r.pax} persona{r.pax > 1 ? "s" : ""}
                      </small>
                    </span>
                    <span className="m adm-mono">{r.monto > 0 ? fmt(r.monto) : "—"}</span>
                  </div>
                  <div className="r2">
                    {r.pagada ? (
                      <Chip c="ok" dot>
                        {r.estadoLabel}
                      </Chip>
                    ) : (
                      <Chip c="sol">{r.estadoLabel}</Chip>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Gap />
        <Sub pad>Deslindes firmados</Sub>
        <div className="adm-card">
          {p.firmas.length === 0 ? (
            <Empty ic="◌" t="Sin firmas" p="No ha firmado ningún deslinde." />
          ) : (
            p.firmas.map((f, i) => (
              <div className="adm-ros" key={i}>
                <span className="adm-tick">✓</span>
                <span className="nm">
                  {f.que}
                  <small>{f.fecha ? "firmado " + f.fecha : "firmado"}</small>
                </span>
              </div>
            ))
          )}
        </div>
        {p.acompanantes.length > 0 && (
          <>
            <Gap />
            <Sub pad>Acompañantes guardados</Sub>
            <div className="adm-card">
              {p.acompanantes.map((c, i) => (
                <div className="adm-ros" key={i}>
                  <span className="adm-av">
                    {c.nombre
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <span className="nm">
                    {c.nombre}
                    <small>{c.relacion}</small>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        <Gap />
        <Sub pad>Encuestas de satisfacción</Sub>
        <div className="adm-card">
          {p.resenas.length === 0 ? (
            <Empty
              ic="◌"
              t="Sin respuestas todavía"
              p="Cuando conteste una encuesta, su calificación y comentario viven aquí."
            />
          ) : (
            p.resenas.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < p.resenas.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                  <b style={{ flex: 1, fontSize: 14 }}>{r.exp}</b>
                  <span className="adm-mono" style={{ fontSize: 13 }}>
                    {r.stars != null ? `${r.stars}/5` : "—"}
                    {r.nps != null ? ` · NPS ${r.nps}` : ""}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontStyle: "italic", lineHeight: 1.5 }}>{r.texto}</p>
                <p className="adm-mut" style={{ fontSize: 11.5, marginTop: 5 }}>
                  {r.fecha}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ROSTER modo campo ── */
export function Roster({ nav, ui, params }: { nav: Nav; ui: Ui; params: Record<string, string> }) {
  const slotId = params.slotId || "";
  const [r, setR] = useState<RosterMovil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [n, setN] = useState(4);
  // El palomeo de abordaje NO tiene columna en la base: es una marca del guía
  // mientras sube la gente a la camioneta. Vive en ESTE teléfono (por salida) y
  // así sobrevive a que se apague la pantalla, que es cuando se perdería.
  const [abordo, setAbordo] = useState<string[]>([]);
  const llave = "adm-roster-abordo:" + slotId;

  useEffect(() => {
    let vivo = true;
    cargarRoster(slotId).then((res) => {
      if (!vivo) return;
      setR(res);
      setCargando(false);
      try {
        const guardado = window.localStorage.getItem(llave);
        if (guardado) setAbordo(JSON.parse(guardado) as string[]);
      } catch {
        /* sin almacenamiento: el palomeo dura lo que dure la pantalla */
      }
    });
    return () => {
      vivo = false;
    };
  }, [slotId, llave]);

  const marcar = useCallback(
    (k: string) => {
      setAbordo((prev) => {
        const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
        try {
          window.localStorage.setItem(llave, JSON.stringify(next));
        } catch {
          /* ídem */
        }
        return next;
      });
    },
    [llave],
  );

  if (cargando || !r) {
    return (
      <div className="adm-screen adm-fieldmode">
        <NavBar onBack={nav.pop} t="Roster" s={cargando ? "cargando…" : "sin datos"} />
        <div className="adm-pad">
          <div className="adm-card">
            {cargando ? (
              <Empty ic="◌" t="Abriendo el roster" p="Un segundo." />
            ) : (
              <Empty
                ic="◌"
                t="No encontré esa salida"
                p="Puede que se haya cancelado, o que el link venga de una pantalla vieja."
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (r.personas.length === 0) {
    return (
      <div className="adm-screen adm-fieldmode">
        <NavBar onBack={nav.pop} t={"Roster · " + r.salida} s={r.experiencia} />
        <div className="adm-pad">
          <div className="adm-card">
            <Empty
              ic="◌"
              t="Esta salida aún no tiene roster"
              p="El roster se arma con las reservas que apartan lugar. Cuando alguien reserve esta salida, sus datos de campo aparecen aquí."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-screen adm-fieldmode">
      <NavBar
        onBack={nav.pop}
        t={"Roster · " + r.salida}
        s={r.personas.length + " personas · modo campo"}
      />
      <div className="adm-pad">
        <Head
          eyebrow={"Roster · " + r.experiencia}
          title={
            r.personas.length +
            " personas, <em>" +
            (r.sinFirmar === 0 ? "todas firmaron." : r.sinFirmar + " sin firmar.") +
            "</em>"
          }
        />
        <Gap s />
        <div className="adm-note adm-note-info">
          <span className="st" style={{ background: "var(--olive)" }}></span>
          <span>
            El palomeo de abordaje se guarda solo en este teléfono. Los datos médicos se ven aquí
            porque el guía los necesita: no se copian ni salen del panel.
          </span>
        </div>
        <Gap s />
        <div style={{ display: "flex", gap: 10 }}>
          <a className="adm-btn adm-btn-ghost" style={{ flex: 1 }} href={r.imprimibleUrl}>
            Imprimible
          </a>
          <a className="adm-btn adm-btn-ghost" style={{ flex: 1 }} href={r.csvUrl}>
            Descargar CSV
          </a>
        </div>
        <Gap />
        <Sub pad>Toca el círculo al abordar</Sub>
        <div className="adm-card">
          {r.personas.slice(0, n).map((x, i) => {
            const k = x.reservationId + "·" + i + "·" + x.nombre;
            const arriba = abordo.includes(k);
            return (
              <div className="adm-fros" key={k}>
                <div className="r1">
                  <b style={arriba ? { opacity: 0.45, textDecoration: "line-through" } : undefined}>
                    {x.nombre}
                    {x.edad != null ? ` · ${x.edad}` : ""}
                  </b>
                  <button
                    className={"adm-tick" + (arriba ? "" : " off")}
                    style={{ width: 38, height: 38, fontSize: 16 }}
                    aria-label={arriba ? "Quitar de abordo" : "Marcar a bordo"}
                    onClick={() => marcar(k)}
                  >
                    ✓
                  </button>
                </div>
                {x.telefono ? (
                  <a className="tel" href={"tel:" + x.telefono.replace(/\s/g, "")}>
                    {x.telefono}
                  </a>
                ) : x.titular ? (
                  <span className="em">
                    Viene con <b>{x.titular}</b>
                  </span>
                ) : null}
                {x.emergencia && x.emergencia !== "—" && (
                  <span className="em">
                    Emergencia · <b>{x.emergencia}</b>
                  </span>
                )}
                {x.adicional && <span className="em">Contrató · {x.adicional}</span>}
                {x.condiciones && <span className="med">{x.condiciones}</span>}
                {!x.firmo && (
                  <button
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    style={{ alignSelf: "flex-start" }}
                    onClick={() =>
                      ui.openDialog("recordarFirma", {
                        tipo: "una",
                        reservationId: x.reservationId,
                        quien: x.nombre,
                      })
                    }
                  >
                    Recordar firma
                  </button>
                )}
              </div>
            );
          })}
          {n < r.personas.length && (
            <div style={{ padding: "12px 16px 16px" }}>
              <button
                className="adm-btn adm-btn-glass adm-btn-block"
                onClick={() => setN(r.personas.length)}
              >
                Ver las {r.personas.length - n} restantes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ENCUESTA ── */
export function Encuesta({ d, nav, ui }: { d: GenteMovil; nav: Nav; ui: Ui }) {
  const e = d.encuesta;
  return (
    <div className="adm-screen">
      <NavBar onBack={nav.pop} t="Encuesta" s="firmas, respuestas y testimonios" />
      <div className="adm-pad">
        <Sub pad>1 · Deslindes pendientes · {e.deslindesPendientes.length}</Sub>
        <div className="adm-card">
          {e.deslindesPendientes.length === 0 ? (
            <Empty ic="✓" t="Todos firmaron" p="No hay deslindes pendientes." />
          ) : (
            <>
              {e.deslindesPendientes.slice(0, 3).map((x) => (
                <div className="adm-ros" key={x.reservationId}>
                  <span className="adm-av">{x.ini}</span>
                  <span className="nm">
                    {x.nombre}
                    <small>{x.sub}</small>
                  </span>
                  <button
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    onClick={() =>
                      ui.openDialog("recordarFirma", {
                        tipo: "una",
                        reservationId: x.reservationId,
                        quien: x.nombre,
                        deslindeUrl: x.deslindeUrl,
                        sinCorreo: x.tieneCorreo ? "" : "1",
                      })
                    }
                  >
                    Recordar
                  </button>
                </div>
              ))}
              {e.deslindesPendientes.length > 3 && (
                <div className="adm-ros">
                  <span className="nm adm-mut">
                    <small>y {e.deslindesPendientes.length - 3} más</small>
                  </span>
                </div>
              )}
              <div style={{ padding: "10px 16px 16px" }}>
                <button
                  className="adm-btn adm-btn-orange adm-btn-block"
                  onClick={() =>
                    ui.openDialog("recordarFirma", {
                      tipo: "todas",
                      n: String(e.deslindesPendientes.length),
                      quien: e.deslindesPendientes.length + " personas",
                    })
                  }
                >
                  Recordar a {e.deslindesPendientes.length === 1 ? "esa persona" : `los ${e.deslindesPendientes.length}`}
                </button>
              </div>
            </>
          )}
        </div>
        <Gap />
        <Sub pad>2 · Encuestas sin responder · {e.totalEncuestasPendientes}</Sub>
        <div className="adm-card">
          {e.encuestasPendientes.length === 0 ? (
            <Empty ic="✓" t="Todas respondidas" p="No hay encuestas pendientes." />
          ) : (
            <>
              {e.encuestasPendientes.map((x) => (
                <div className="adm-ros" key={x.experienceId}>
                  <span className="adm-av">{x.ini}</span>
                  <span className="nm">
                    {x.nombre}
                    <small>{x.sub}</small>
                  </span>
                  <button
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    onClick={() =>
                      ui.openDialog("confirmLote", {
                        tipo: "encuesta-exp",
                        experienceId: x.experienceId,
                        n: String(x.cnt),
                        que: "reenvío de encuesta · " + x.nombre,
                      })
                    }
                  >
                    Reenviar
                  </button>
                </div>
              ))}
              <div style={{ padding: "10px 16px 16px" }}>
                <button
                  className="adm-btn adm-btn-ghost adm-btn-block"
                  onClick={() =>
                    ui.openDialog("confirmLote", {
                      tipo: "encuesta-todas",
                      n: String(e.totalEncuestasPendientes),
                      que: "reenvío de encuesta",
                    })
                  }
                >
                  Reenviar a los {e.totalEncuestasPendientes} pendientes
                </button>
              </div>
            </>
          )}
        </div>
        <Gap />
        <Sub pad>3 · Link de encuesta del grupo</Sub>
        <div className="adm-card">
          {e.linksGrupo.length === 0 ? (
            <Empty
              ic="◌"
              t="Todavía no aplica"
              p="El link del grupo aparece cuando una salida con encuesta encendida ya terminó."
            />
          ) : (
            e.linksGrupo.map((l) => (
              <div key={l.slotId} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
                <b style={{ fontSize: 14 }}>
                  {l.experiencia} · {l.label}
                </b>
                <p className="adm-mut" style={{ fontSize: 12, lineHeight: 1.5, margin: "4px 0 10px" }}>
                  {l.url
                    ? `Para el WhatsApp del grupo — la contestan también los acompañantes que no compraron. ${l.respuestas} ${l.respuestas === 1 ? "respuesta" : "respuestas"}.`
                    : "Esta salida todavía no tiene link de grupo. Se genera en el panel de computadora."}
                </p>
                {l.url ? (
                  <CopyBox v={l.url} onCopy={ui.copy} />
                ) : (
                  <a className="adm-btn adm-btn-ghost adm-btn-sm" href="/caminante/admin/encuesta">
                    Generar en el panel
                  </a>
                )}
              </div>
            ))
          )}
        </div>
        <Gap />
        <Sub pad>4 · Testimonios por aprobar · {e.testimonios.length}</Sub>
        <div className="adm-card">
          {e.testimonios.length === 0 ? (
            <Empty ic="◌" t="Nada por aprobar" p="Los testimonios nuevos llegan aquí antes de publicarse." />
          ) : (
            e.testimonios.map((t) => (
              <div key={t.id} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
                <p style={{ fontSize: 14, fontStyle: "italic", lineHeight: 1.5 }}>{t.texto}</p>
                <p className="adm-mut" style={{ fontSize: 11.5, margin: "6px 0 10px" }}>
                  {t.quien}
                  {t.stars != null ? ` · ${t.stars}/5` : ""} · se publica con iniciales
                </p>
                {!t.consent && (
                  <div style={{ marginBottom: 10 }}>
                    <Chip c="warn">Sin consentimiento — no se publica</Chip>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Sin consentimiento no hay botón que aprobar: la acción lo
                      rebota igual, y ofrecerlo sería prometer algo imposible. */}
                  {t.consent && (
                    <button
                      className="adm-btn adm-btn-orange adm-btn-sm"
                      style={{ flex: 1 }}
                      disabled={ui.pendiente}
                      onClick={() =>
                        ui.run("Testimonio aprobado", () => decidirTestimonio(t.id, "approved"))
                      }
                    >
                      Aprobar publicación
                    </button>
                  )}
                  <button
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    style={{ flex: 1 }}
                    disabled={ui.pendiente}
                    onClick={() => ui.run("Testimonio rechazado", () => decidirTestimonio(t.id, "rejected"))}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── sheets/diálogos de Gente ── */

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function SheetRegistrarPago({
  d,
  ui,
  params,
}: {
  d: GenteMovil;
  ui: Ui;
  params: Record<string, string>;
}) {
  const r = d.reservas.find((x) => x.id === params.reservationId);
  const debe = r ? r.debe : 0;
  const [metodo, setMetodo] = useState("Transferencia");
  const [monto, setMonto] = useState(debe > 0 ? fmt(debe) : "");
  const [fecha, setFecha] = useState(hoyISO);
  if (!r) {
    return (
      <div className="adm-sheet">
        <div className="grab"></div>
        <h2>Registrar pago</h2>
        <p className="sd">Esa reserva ya no está en la lista.</p>
        <div className="adm-acts">
          <button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }
  const m = parseInt(monto.replace(/\D/g, ""), 10) || 0;
  return (
    <div className="adm-sheet">
      <div className="grab"></div>
      <h2>Registrar pago</h2>
      <p className="sd">
        {r.persona} · {r.expLabel} ·{" "}
        {debe > 0 ? `saldo ${fmt(debe)}` : r.total > 0 ? "sin saldo abierto" : "cobrada fuera del sistema"}
      </p>
      <div className="adm-fld">
        <label>Método</label>
        <Seg opts={["Transferencia", "Efectivo"]} val={metodo} set={setMetodo} />
      </div>
      <div className="adm-2col">
        <Fld l="Monto" val={monto} set={setMonto} mono />
        <Fld l="Fecha" val={fecha} set={setFecha} type="date" mono />
      </div>
      <p className="sd" style={{ margin: "2px 0 0" }}>
        Así entran al ledger los cobros hechos fuera de Stripe. El comprobante y las ventas nuevas
        (quien todavía no existe en la plataforma) viven en Recursos.
      </p>
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>
          Cancelar
        </button>
        <button
          className="adm-btn adm-btn-orange"
          disabled={m <= 0 || ui.pendiente}
          onClick={() => {
            ui.closeSheet();
            ui.run(`Pago registrado · ${fmt(m)} · ${r.persona}`, () =>
              registrarPago({
                reservationId: r.id,
                monto: m,
                metodo: metodo === "Efectivo" ? "cash" : "transfer",
                fecha,
              }),
            );
          }}
        >
          Registrar {m > 0 ? fmt(m) : "—"}
        </button>
      </div>
    </div>
  );
}

export function DialogCancelarReserva({
  d,
  ui,
  params,
}: {
  d: GenteMovil;
  ui: Ui;
  params: Record<string, string>;
}) {
  const r = d.reservas.find((x) => x.id === params.reservationId);
  if (!r) {
    return (
      <div className="adm-dlg">
        <h2>Esa reserva ya no está</h2>
        <p>Vuelve a abrirla desde la lista.</p>
        <div className="adm-acts">
          <button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="adm-dlg">
      <h2 style={{ color: "#e8431f" }}>¿Cancelar la reserva de {r.persona}?</h2>
      <p>
        {r.expLabel} · {r.pax} persona{r.pax > 1 ? "s" : ""}
        {r.pagado > 0 ? (
          <>
            {" "}
            · pagó <b>{fmt(r.pagado)}</b>
          </>
        ) : null}
        . Se libera{r.pax > 1 ? "n" : ""} su{r.pax > 1 ? "s" : ""} lugar{r.pax > 1 ? "es" : ""}.{" "}
        {r.pagado > 0 && (
          <>
            El reembolso <b>no es automático</b>: los pagos quedan como historial y el reembolso se
            hace aparte.
          </>
        )}
      </p>
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>
          Conservar
        </button>
        <button
          className="adm-btn adm-btn-orange"
          disabled={ui.pendiente}
          onClick={() => {
            ui.closeDialog();
            ui.run(`Reserva cancelada · ${r.persona}`, () => cancelarReservaMovil(r.id));
          }}
        >
          Cancelar reserva
        </button>
      </div>
    </div>
  );
}

export function DialogConfirmarLote({ ui, params }: { ui: Ui; params: Record<string, string> }) {
  const n = Number(params.n || "0");
  const que = params.que || "el envío";
  const correr = () =>
    params.tipo === "encuesta-exp"
      ? reenviarEncuestaExperiencia(params.experienceId || "")
      : reenviarEncuestaPendientesTodas();
  return (
    <div className="adm-dlg">
      <h2>
        Vas a escribirle a {n} persona{n === 1 ? "" : "s"}
      </h2>
      <p>
        {que.charAt(0).toUpperCase() + que.slice(1)}. Es un mensaje real a clientes reales — se envía
        una sola vez.
      </p>
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>
          Revisar lista
        </button>
        <button
          className="adm-btn adm-btn-orange"
          disabled={ui.pendiente}
          onClick={() => {
            ui.closeDialog();
            ui.run(`Enviado a ${n}`, correr);
          }}
        >
          Enviar a {n}
        </button>
      </div>
    </div>
  );
}

export function DialogRecordarFirma({ ui, params }: { ui: Ui; params: Record<string, string> }) {
  const lote = params.tipo === "todas";
  const n = Number(params.n || "1");
  const quien = params.quien || "esa persona";
  const url = params.deslindeUrl || "";
  const sinCorreo = params.sinCorreo === "1";
  return (
    <div className="adm-dlg">
      <h2>Recordar la firma{lote ? " a " + n + " personas" : ""}</h2>
      <p>
        {lote ? (
          <>
            Se les manda el link del deslinde a <b>{n} personas</b> que apartaron lugar y no han
            firmado.
          </>
        ) : (
          <>
            <b>{quien}</b> apartó lugar y no ha firmado.
            {sinCorreo
              ? " No tenemos su correo: copia el link y mándaselo por WhatsApp."
              : " Se le manda el link del deslinde."}
          </>
        )}
      </p>
      <div className="adm-acts">
        {/* El correo es el único envío automático que existe para el deslinde.
            Por WhatsApp no hay plantilla aprobada, así que el botón copia el
            link para pegarlo en el chat — no promete un envío que no ocurre. */}
        {!lote && url && (
          <button
            className="adm-btn adm-btn-forest"
            style={{ flex: 1 }}
            onClick={() => {
              ui.copy(url);
              ui.closeDialog();
            }}
          >
            Copiar link
          </button>
        )}
        <button
          className="adm-btn adm-btn-ghost"
          style={{ flex: 1 }}
          disabled={ui.pendiente || (!lote && sinCorreo)}
          onClick={() => {
            ui.closeDialog();
            ui.run(lote ? `Recordatorio enviado a ${n}` : `Recordatorio enviado a ${quien}`, () =>
              lote ? recordarFirmaATodos() : recordarFirma(params.reservationId || ""),
            );
          }}
        >
          Mandar por correo
        </button>
      </div>
      <div className="adm-acts" style={{ paddingTop: 8 }}>
        <button className="adm-btn adm-btn-ghost adm-btn-block" onClick={ui.closeDialog}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
