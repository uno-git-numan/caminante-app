"use client";

// EVENTOS · detalle, hojas y diálogos — transcritos de `ScrEvento`,
// `ShEditarSalida`, `ShOperador`, `DlgRechazoCancelar`,
// `DlgConfirmCancelarSalida`, `DlgCandado` y `DlgEliminarExp`
// (design/admin-movil/adm-screens-a.jsx).
//
// El teléfono OPERA: cupo, precio, fechas y venta de una salida, operador y
// publicar. Crear experiencias y autorar contenido sigue viviendo en el
// formulario del panel de computadora (regla: el formulario CREA, el dashboard
// OPERA).
//
// Cero lógica de escritura nueva: todas las mutaciones son las server actions
// de lib/admin/eventos-actions.ts, disparadas con ui.run (que hace toast y
// refresca). Las guardas duras viven ahí y se re-verifican en el servidor:
//   · las salidas no se borran, se cierran;
//   · cancelar solo si nadie aparta lugar;
//   · el cupo nunca por debajo de la ocupación;
//   · `ends_at` nunca antes de `starts_at` (dispara la encuesta +24h);
//   · publicar exige deslinde + encuesta (el candado de este archivo).
// Aquí solo se avisa ANTES, para que el teléfono no falle en silencio.

import { useState } from "react";
import type { EventoMovil, EventosMovil, SalidaMovil } from "@/lib/admin/movil/eventos";
import type { Nav, Ui } from "./AppShell";
import { Chip, Empty, Eyebrow, Fld, Gap, NavBar, Sub, fmt } from "./kit";
import {
  assignOperator,
  createOperator,
  deleteExperience,
  setExperienceStatus,
  updateSlot,
} from "@/lib/admin/eventos-actions";

const buscar = (d: EventosMovil, slug?: string) => d.eventos.find((x) => x.slug === slug) || null;
const buscarSalida = (e: EventoMovil | null, id?: string) =>
  e?.salidas.find((s) => s.id === id) || null;

const NoExiste = ({ onBack }: { onBack: () => void }) => (
  <div className="adm-screen">
    <NavBar onBack={onBack} t="Experiencia no encontrada" s="" />
    <div className="adm-pad">
      <div className="adm-card">
        <Empty ic="◌" t="Ya no está aquí" p="Esta experiencia ya no aparece en el panel." />
      </div>
    </div>
  </div>
);

// ── EVENTOS · detalle ────────────────────────────────────────────────────

export default function Evento({
  d,
  nav,
  ui,
  params,
}: {
  d: EventosMovil;
  nav: Nav;
  ui: Ui;
  params: Record<string, string>;
}) {
  const e = buscar(d, params.slug);
  if (!e) return <NoExiste onBack={nav.pop} />;

  const sal = e.salidas;

  return (
    <div className="adm-screen">
      <NavBar
        onBack={nav.pop}
        t={e.nombre}
        s={(e.operadorNombre || "propia") + " · " + (e.publicada ? "publicada" : "borrador")}
        right={
          e.publicada ? (
            <Chip c="ok" dot>
              Publicada
            </Chip>
          ) : (
            <Chip c="mut">Borrador</Chip>
          )
        }
      />
      <div className="adm-pad">
        {sal.length > 0 && <Sub pad>Salidas</Sub>}
        {sal.length > 0 && (
          <div className="adm-card">
            {sal.map((s) => (
              <details className="adm-li" key={s.id}>
                <summary>
                  <div className="r1">
                    <span className="t">
                      {s.label}
                      <small>{s.fecha}</small>
                    </span>
                    <button
                      className="m adm-mono"
                      style={{
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                        textDecorationColor: "var(--sand)",
                        padding: "4px 0",
                      }}
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        nav.push("roster", { slotId: s.id });
                      }}
                    >
                      {s.taken} de {s.capacity ?? "∞"}
                    </button>
                  </div>
                  <div className="r2">
                    {s.pasada ? (
                      <Chip c="mut">Pasada</Chip>
                    ) : s.enVenta ? (
                      <Chip c="ok" dot>
                        En venta
                      </Chip>
                    ) : (
                      <Chip c="mut">Venta cerrada</Chip>
                    )}
                    {s.privada && <Chip c="sol">Privada</Chip>}
                    {/* Sin precio propio la salida cobra el precio base de la
                        experiencia: se dice, no se inventa un número. */}
                    <span className="dt">
                      {s.priceMxn != null ? `${fmt(s.priceMxn)}/persona` : "precio base"}
                    </span>
                    {s.encInvitadas > 0 && (
                      <span className="dt">
                        encuesta {s.encRespondidas}/{s.encInvitadas}
                        {s.encStars != null ? ` · ${s.encStars}★` : ""}
                      </span>
                    )}
                  </div>
                </summary>
                <div className="adm-x">
                  <div className="adm-acts">
                    {s.taken > 0 && (
                      <button
                        className="adm-btn adm-btn-forest"
                        onClick={() => nav.push("roster", { slotId: s.id })}
                      >
                        Quién va · {s.taken}
                      </button>
                    )}
                    <button
                      className="adm-btn adm-btn-ghost"
                      onClick={() => ui.openSheet("editarSalida", { slug: e.slug, slotId: s.id })}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
        {sal.length === 0 && (
          <div className="adm-card">
            <Empty
              ic="◌"
              t="Sin salidas"
              p="Las fechas se agregan en el formulario de la experiencia, junto con su contenido."
              btn={
                <a
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  href={`/caminante/admin/experiencias/${e.slug}#s14`}
                >
                  Agregar fechas
                </a>
              }
            />
          </div>
        )}

        <Gap />
        <Sub pad>Experiencia</Sub>
        <div className="adm-card adm-menu">
          <button className="mrow" onClick={() => ui.openSheet("operador", { slug: e.slug })}>
            <span className="mi">OP</span>
            <span className="grow">
              Operador
              <small>
                {e.operadorNombre
                  ? e.operadorNombre +
                    " · " +
                    (e.operadorComision == null
                      ? "comisión por definir"
                      : "comisión " + e.operadorComision + "%")
                  : "sin operador asignado"}
              </small>
            </span>
            <span className="go">›</span>
          </button>
          <button className="mrow" onClick={() => nav.push("contenido", { slug: e.slug })}>
            <span className="mi">ED</span>
            <span className="grow">
              Contenido
              <small>
                {e.secciones.length} insumos · {e.seccionesOk} listos
              </small>
            </span>
            <span className="go">›</span>
          </button>
          <button
            className="mrow"
            disabled={ui.pendiente}
            onClick={() => {
              // El candado NO se salta desde el teléfono: si falta deslinde o
              // encuesta se dice por qué (la server action lo rechazaría igual).
              if (!e.publicada && !e.candado.ok) {
                ui.openDialog("candado", { slug: e.slug });
                return;
              }
              ui.run(e.publicada ? "Pasó a borrador" : "Publicada", () =>
                setExperienceStatus({
                  experienceId: e.id,
                  slug: e.slug,
                  status: e.publicada ? "draft" : "published",
                }),
              );
            }}
          >
            <span className="mi">PB</span>
            <span className="grow">
              Publicación
              <small>
                {e.publicada
                  ? "publicada · pasar a borrador"
                  : e.candado.ok
                    ? "borrador · publicar"
                    : "borrador · con candado"}
              </small>
            </span>
            <span className="go">›</span>
          </button>
          {/* El Kit, el PDF y el flyer viven en la sección Comunicación del
              panel (rasterizan láminas del DOM: no existen en el teléfono). */}
          <a className="mrow" href={`/caminante/admin/comunicacion#ev-${e.slug}`}>
            <span className="mi">SA</span>
            <span className="grow">
              Material de comunicación
              <small>Kit · PDF v/h · flyer · página pública</small>
            </span>
            <span className="go">›</span>
          </a>
          <button
            className="mrow out"
            onClick={() => ui.openDialog("eliminarExp", { slug: e.slug })}
          >
            <span className="mi" style={{ background: "rgba(255,93,54,.1)", color: "var(--orange)" }}>
              EL
            </span>
            <span className="grow">Eliminar la experiencia</span>
            <span className="go">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HOJA · editar salida ─────────────────────────────────────────────────

export function ShEditarSalida({
  d,
  ui,
  params,
}: {
  d: EventosMovil;
  ui: Ui;
  params: Record<string, string>;
}) {
  const e = buscar(d, params.slug);
  const s = buscarSalida(e, params.slotId);
  return s && e ? <EditarSalida e={e} s={s} ui={ui} /> : null;
}

function EditarSalida({ e, s, ui }: { e: EventoMovil; s: SalidaMovil; ui: Ui }) {
  const [f, setF] = useState({
    etiqueta: s.label,
    ini: s.inicioInput,
    fin: s.finInput,
    cupo: s.capacity != null ? String(s.capacity) : "",
    precio: s.priceMxn != null ? fmt(s.priceMxn) : "",
  });

  const cupoN = f.cupo.trim() === "" ? null : parseInt(f.cupo.replace(/\D/g, ""), 10);
  const cupoErr = cupoN != null && (Number.isNaN(cupoN) || cupoN < s.taken);
  // El fin dispara la encuesta +24h: invertido le manda «¿cómo te fue?» a
  // gente que todavía no viaja. Se avisa aquí y lo rechaza el servidor.
  const finErr = !!f.fin && !!f.ini && f.fin < f.ini;
  const ok = !cupoErr && !finErr && !!f.ini && !!f.etiqueta.trim();

  const precioN = f.precio.replace(/\D/g, "");

  return (
    <div className="adm-sheet">
      <div className="grab"></div>
      <h2>Editar salida</h2>
      <p className="sd">{s.label}</p>
      <Fld l="Etiqueta" val={f.etiqueta} set={(v) => setF({ ...f, etiqueta: v })} />
      <div className="adm-2col">
        <Fld l="Inicio" val={f.ini} set={(v) => setF({ ...f, ini: v })} type="date" mono />
        <Fld
          l="Fin"
          val={f.fin}
          set={(v) => setF({ ...f, fin: v })}
          type="date"
          mono
          err={finErr}
          hint={finErr ? "El fin no puede ser antes del inicio." : ""}
        />
      </div>
      <div className="adm-2col">
        <Fld
          l="Cupo"
          val={f.cupo}
          set={(v) => setF({ ...f, cupo: v })}
          mono
          err={cupoErr}
          hint={
            cupoErr
              ? `Hay ${s.taken} lugares ocupados — el cupo no puede quedar abajo de la ocupación.`
              : "vacío = sin tope"
          }
        />
        <Fld
          l="Precio"
          val={f.precio}
          set={(v) => setF({ ...f, precio: v })}
          mono
          hint="vacío = precio base"
        />
      </div>
      <Sub>Venta</Sub>
      {/* Una salida que ya se fue no se reabre desde aquí: el cron diario
          `cerrar-salidas` la volvería a cerrar a la mañana siguiente. */}
      {s.pasada ? (
        <div className="adm-note adm-note-info" style={{ marginTop: 8 }}>
          <span className="st" style={{ background: "var(--sand)" }}></span>
          <span>Esta salida ya pasó. Se cerró sola; su historia y sus reservas se conservan.</span>
        </div>
      ) : (
      <div className="adm-acts" style={{ paddingTop: 8 }}>
        <button
          className="adm-btn adm-btn-ghost"
          disabled={ui.pendiente}
          onClick={async () => {
            await ui.run(s.enVenta ? "Venta cerrada" : "Venta reabierta", () =>
              updateSlot({ slotId: s.id, slug: e.slug, status: s.enVenta ? "closed" : "open" }),
            );
            ui.closeSheet();
          }}
        >
          {s.enVenta ? "Cerrar venta" : "Reabrir venta"}
        </button>
        {s.privada && s.linkPrivado && (
          <button className="adm-btn adm-btn-ghost" onClick={() => ui.copy(s.linkPrivado!)}>
            Copiar link privado
          </button>
        )}
        <button
          className="adm-btn adm-btn-danger"
          onClick={() => {
            ui.closeSheet();
            // Cancelar borra la salida de la venta: solo si nadie aparta lugar.
            if (s.taken > 0) ui.openDialog("rechazoCancelar", { slug: e.slug, slotId: s.id });
            else ui.openDialog("confirmCancelarSalida", { slug: e.slug, slotId: s.id });
          }}
        >
          Cancelar salida
        </button>
      </div>
      )}
      <div
        className="adm-acts"
        style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 14 }}
      >
        <button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>
          Cancelar
        </button>
        <button
          className="adm-btn adm-btn-orange"
          disabled={!ok || ui.pendiente}
          onClick={async () => {
            await ui.run("Salida guardada", () =>
              updateSlot({
                slotId: s.id,
                slug: e.slug,
                label: f.etiqueta.trim(),
                // Misma convención que el formulario: la fecha se guarda a
                // mediodía UTC (inicio) y a las 23:00 UTC (fin), para que
                // ninguna zona horaria mueva la salida un día.
                startsAt: `${f.ini}T12:00:00Z`,
                endsAt: f.fin ? `${f.fin}T23:00:00Z` : null,
                capacityTotal: cupoN,
                priceMxn: precioN ? parseInt(precioN, 10) : null,
              }),
            );
            ui.closeSheet();
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

// ── HOJA · operador ──────────────────────────────────────────────────────

export function ShOperador({
  d,
  ui,
  params,
}: {
  d: EventosMovil;
  ui: Ui;
  params: Record<string, string>;
}) {
  const e = buscar(d, params.slug);
  return e ? <Operador d={d} e={e} ui={ui} /> : null;
}

function Operador({ d, e, ui }: { d: EventosMovil; e: EventoMovil; ui: Ui }) {
  const [sel, setSel] = useState(e.operadorId || "");
  const [nuevo, setNuevo] = useState(false);
  const [nm, setNm] = useState("");
  const [mail, setMail] = useState("");
  const [com, setCom] = useState("15");
  const [porDef, setPorDef] = useState(false);

  return (
    <div className="adm-sheet">
      <div className="grab"></div>
      <h2>Operador de la experiencia</h2>
      <p className="sd">Cobra su comisión sobre lo vendido.</p>
      <div className="adm-card" style={{ boxShadow: "none" }}>
        {d.operadores.map((o) => (
          <div
            className="adm-ros"
            key={o.id}
            onClick={() => setSel(o.id)}
            style={{ cursor: "pointer" }}
          >
            <span className="adm-av">{o.nombre.slice(0, 2).toUpperCase()}</span>
            <span className="nm">
              {o.nombre}
              <small>
                {o.comision == null ? "comisión por definir" : "comisión " + o.comision + "%"}
              </small>
            </span>
            <span className={"adm-tick" + (sel === o.id ? "" : " off")}>✓</span>
          </div>
        ))}
        {!d.operadores.length ? (
          <div className="adm-ros">
            <span className="nm">
              Sin operadores dados de alta<small>crea el primero abajo</small>
            </span>
          </div>
        ) : null}
      </div>
      <Gap s />
      {!nuevo ? (
        <button className="adm-btn adm-btn-ghost adm-btn-block" onClick={() => setNuevo(true)}>
          + Crear operador nuevo
        </button>
      ) : (
        <div>
          <Fld l="Nombre" val={nm} set={setNm} ph="Nombre del operador" />
          <Fld l="Correo" val={mail} set={setMail} ph="correo@operador.mx" type="email" />
          <div className="adm-fld">
            <label>Comisión</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="mono-in"
                style={{ width: 90, opacity: porDef ? 0.4 : 1 }}
                value={porDef ? "—" : com + " %"}
                onChange={(ev) => setCom(ev.target.value.replace(/\D/g, ""))}
                readOnly={porDef}
              />
              <button
                className={"adm-btn adm-btn-sm " + (porDef ? "adm-btn-forest" : "adm-btn-ghost")}
                onClick={() => setPorDef(!porDef)}
              >
                Por definir
              </button>
            </div>
            <span className="hint">
              «Por definir» bloquea el payout hasta fijarla — nunca se paga con comisión en cero por
              accidente.
            </span>
          </div>
        </div>
      )}
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost" onClick={ui.closeSheet}>
          Cancelar
        </button>
        <button
          className="adm-btn adm-btn-orange"
          disabled={ui.pendiente || (nuevo ? !nm.trim() || !mail.trim() : !sel)}
          onClick={async () => {
            await ui.run("Operador guardado", async () => {
              if (nuevo) {
                const r = await createOperator({
                  name: nm,
                  email: mail,
                  commissionPct: porDef ? null : parseInt(com, 10) || 0,
                });
                if (!r.ok || !r.operatorId) return r;
                return assignOperator({
                  experienceId: e.id,
                  slug: e.slug,
                  operatorId: r.operatorId,
                });
              }
              return assignOperator({ experienceId: e.id, slug: e.slug, operatorId: sel || null });
            });
            ui.closeSheet();
          }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

// ── DIÁLOGOS ─────────────────────────────────────────────────────────────

export function DlgRechazoCancelar({
  d,
  nav,
  ui,
  params,
}: {
  d: EventosMovil;
  nav: Nav;
  ui: Ui;
  params: Record<string, string>;
}) {
  const e = buscar(d, params.slug);
  const s = buscarSalida(e, params.slotId);
  if (!e || !s) return null;
  return (
    <div className="adm-dlg">
      <h2>No se puede cancelar esta salida</h2>
      <p>
        <b>
          {s.taken} {s.taken === 1 ? "persona está apartando" : "personas están apartando"} lugar
        </b>{" "}
        en {s.label}. Cancelar borraría su compra sin avisarles.
      </p>
      <div className="adm-lock">
        <div className="it">
          <span className="st" style={{ background: "var(--olive)" }}></span>
          <span className="g">
            Cierra la venta<small>deja de vender sin tocar las reservas</small>
          </span>
          <button
            className="lnk"
            disabled={ui.pendiente || !s.enVenta}
            onClick={async () => {
              await ui.run("Venta cerrada", () =>
                updateSlot({ slotId: s.id, slug: e.slug, status: "closed" }),
              );
              ui.closeDialog();
            }}
          >
            {s.enVenta ? "Cerrar" : "Ya cerrada"}
          </button>
        </div>
        <div className="it">
          <span className="st" style={{ background: "var(--olive)" }}></span>
          <span className="g">
            Contacta a los reservados
            <small>si de verdad no saldrá, primero se les avisa y reembolsa</small>
          </span>
          <button
            className="lnk"
            onClick={() => {
              ui.closeDialog();
              nav.push("roster", { slotId: s.id });
            }}
          >
            Ver
          </button>
        </div>
      </div>
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost adm-btn-block" onClick={ui.closeDialog}>
          Entendido
        </button>
      </div>
    </div>
  );
}

export function DlgConfirmCancelarSalida({
  d,
  ui,
  params,
}: {
  d: EventosMovil;
  ui: Ui;
  params: Record<string, string>;
}) {
  const e = buscar(d, params.slug);
  const s = buscarSalida(e, params.slotId);
  if (!e || !s) return null;
  return (
    <div className="adm-dlg">
      <h2 style={{ color: "#e8431f" }}>¿Cancelar «{s.label}»?</h2>
      <p>No tiene reservas — se puede soltar sin costo. Desaparece de la venta.</p>
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>
          Conservar
        </button>
        <button
          className="adm-btn adm-btn-orange"
          disabled={ui.pendiente}
          onClick={async () => {
            await ui.run("Salida cancelada", () =>
              updateSlot({ slotId: s.id, slug: e.slug, status: "cancelled" }),
            );
            ui.closeDialog();
          }}
        >
          Cancelar salida
        </button>
      </div>
    </div>
  );
}

export function DlgCandado({
  d,
  ui,
  params,
}: {
  d: EventosMovil;
  ui: Ui;
  params: Record<string, string>;
}) {
  const e = buscar(d, params.slug);
  if (!e) return null;
  const n = e.candado.faltantes.length;
  return (
    <div className="adm-dlg">
      <Eyebrow>Casi lista</Eyebrow>
      <h2 style={{ marginTop: 8 }}>
        A {e.nombre} le falta{n > 1 ? "n" : ""} {n} cosa{n > 1 ? "s" : ""} para publicarse
      </h2>
      <p>Es el estándar de la casa: nadie compra sin deslinde ni se va sin encuesta.</p>
      <div className="adm-lock">
        {/* Las razones son las de listaParaPublicar, textuales: dicen qué falta
            y en qué sección del formulario se arregla. */}
        {e.candado.faltantes.map((c, i) => (
          <div className="it" key={i}>
            <span className="st" style={{ background: "var(--orange)" }}></span>
            <span className="g">{c}</span>
            <button
              className="lnk"
              onClick={() => {
                ui.closeDialog();
                window.location.href = `/caminante/admin/experiencias/${e.slug}${
                  /deslinde|registro/i.test(c) ? "#s15" : "#s16"
                }`;
              }}
            >
              Abrir
            </button>
          </div>
        ))}
      </div>
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost adm-btn-block" onClick={ui.closeDialog}>
          Volver
        </button>
      </div>
    </div>
  );
}

export function DlgEliminarExp({
  d,
  nav,
  ui,
  params,
}: {
  d: EventosMovil;
  nav: Nav;
  ui: Ui;
  params: Record<string, string>;
}) {
  const e = buscar(d, params.slug);
  const [txt, setTxt] = useState("");
  if (!e) return null;
  return (
    <div className="adm-dlg">
      <h2 style={{ color: "#e8431f" }}>¿Eliminar «{e.nombre}»?</h2>
      {/* La guarda real del sistema: con una sola reserva NO se elimina (la
          historia comercial y legal se conserva) — ahí el camino es «pasar a
          borrador», que la quita del sitio sin borrar nada. */}
      <p>
        Se borran la experiencia, su contenido y sus salidas. <b>No se puede deshacer.</b> Solo se
        permite si no tiene ninguna reserva; si ya vendió, pásala a borrador.
      </p>
      <div className="adm-fld" style={{ paddingTop: 14 }}>
        <label>Escribe ELIMINAR para confirmar</label>
        <input
          className="mono-in"
          value={txt}
          onChange={(ev) => setTxt(ev.target.value)}
          placeholder="ELIMINAR"
        />
      </div>
      <div className="adm-acts">
        <button className="adm-btn adm-btn-ghost" onClick={ui.closeDialog}>
          Conservar
        </button>
        <button
          className="adm-btn adm-btn-orange"
          disabled={txt.trim().toUpperCase() !== "ELIMINAR" || ui.pendiente}
          onClick={async () => {
            // Solo se sale de la pantalla si de verdad se borró: si la guarda
            // del servidor la rechazó (tiene reservas), el toast lo dice y la
            // experiencia sigue ahí.
            let hecho = false;
            await ui.run("Experiencia eliminada", async () => {
              const r = await deleteExperience({ experienceId: e.id });
              hecho = r.ok;
              return r;
            });
            ui.closeDialog();
            if (hecho) nav.pop();
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
