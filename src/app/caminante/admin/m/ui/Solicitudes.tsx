"use client";

// SOLICITUDES — transcrita de `ScrSolicitudes` (adm-screens-c.jsx): tres
// bandejas (fechas · operador · embajador), su detalle en acordeón y el
// histórico abajo.
//
// Las tres acciones son las MISMAS del panel de escritorio, sin lógica nueva:
//   · fecha     → approveSlotRequest / rejectSlotRequest (solicitudes-actions)
//   · operador  → approveOperador / rejectOperador (accesos-actions)
//   · embajador → approveEmbajador / rejectEmbajador (embajadores-actions)
//
// ⚠️ `approveSlotRequest` NO revalida a propósito: si la lista se refrescara, la
// tarjeta con el link recién creado desaparecería antes de poder copiarse. Aquí
// eso se respeta guardando el resultado en el estado de la pantalla: aunque el
// refresco saque la solicitud de la lista de pendientes, el link y el mensaje
// siguen en pantalla hasta que se sale.
//
// El entregable pinta un solo botón «Aprobar · crear salida»; la salida real
// necesita al menos etiqueta y fecha de inicio (y el fin, que es lo que dispara
// la encuesta +24h), así que la fila trae el mismo mini-formulario del panel de
// escritorio, prellenado con lo que pidió el cliente.

import { useState } from "react";
import { approveSlotRequest, rejectSlotRequest, type AprobarResult } from "@/lib/admin/solicitudes-actions";
import { approveOperador, rejectOperador } from "@/lib/admin/accesos-actions";
import { approveEmbajador, rejectEmbajador } from "@/lib/admin/embajadores-actions";
import type { MasMovil, SolFechaMovil } from "@/lib/admin/movil/mas";
import type { Nav, Ui } from "./AppShell";
import { Chip, CopyBox, Empty, Fld, Gap, NavBar, Seg, Sub } from "./kit";

type Aprobada = Extract<AprobarResult, { ok: true }>;

// "2026-12-05" → "Dic 5" (mismo estilo de etiqueta que el formulario).
function labelDesdeFecha(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  const mes = d.toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" }).replace(".", "");
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${d.getUTCDate()}`;
}

function FilaFecha({
  s,
  ui,
  onAprobada,
}: {
  s: SolFechaMovil;
  ui: Ui;
  onAprobada: (id: string, r: Aprobada) => void;
}) {
  const [label, setLabel] = useState(s.desiredDate ? labelDesdeFecha(s.desiredDate) : "");
  const [inicia, setInicia] = useState(s.desiredDate ?? "");
  const [termina, setTermina] = useState("");
  const [cupo, setCupo] = useState(String(s.personas));
  const [precio, setPrecio] = useState("");
  const [vis, setVis] = useState(s.groupType === "open" ? "Abierta" : "Privada");

  return (
    <details className="adm-li" open>
      <summary>
        <div className="r1">
          <span className="t">
            {s.cliente}
            <small>
              {s.experiencia} · {s.personas} persona{s.personas === 1 ? "" : "s"}
            </small>
          </span>
        </div>
        <div className="r2">
          <Chip c="sol">Pendiente · {s.hace}</Chip>
          <Chip c="mut">{s.groupType === "open" ? "salida abierta" : "grupo privado"}</Chip>
        </div>
      </summary>
      <div className="adm-x">
        <Sub>Lo que pidió</Sub>
        <p style={{ fontSize: 12.5, lineHeight: 1.55, padding: "2px 0 6px" }}>
          {s.desiredDate ? `Fecha deseada: ${s.desiredDate}` : "Fechas flexibles"}
          <br />
          <span className="adm-mut">
            {s.email} · {s.whatsapp}
          </span>
          {s.nota ? (
            <>
              <br />
              <span style={{ fontStyle: "italic" }}>“{s.nota}”</span>
            </>
          ) : null}
        </p>
        <Sub>La salida que se va a crear</Sub>
        <Fld l="Etiqueta" val={label} set={setLabel} ph="Dic 5-7" />
        <Fld l="Inicia" val={inicia} set={setInicia} type="date" />
        <Fld l="Termina" val={termina} set={setTermina} type="date" hint="Dispara la encuesta 24 h después." />
        <Fld l="Cupo" val={cupo} set={setCupo} mono ph="sin tope" />
        <Fld l="Precio por persona" val={precio} set={setPrecio} mono ph="el de la experiencia" />
        <Sub>Visibilidad</Sub>
        <div style={{ paddingTop: 8 }}>
          <Seg opts={["Privada", "Abierta"]} val={vis} set={setVis} />
        </div>
        <div className="adm-acts">
          <button
            className="adm-btn adm-btn-orange"
            disabled={ui.pendiente}
            onClick={() =>
              ui.run("Salida creada", async () => {
                const r = await approveSlotRequest({
                  requestId: s.id,
                  label: label.trim(),
                  startsAt: inicia,
                  endsAt: termina || null,
                  capacity: cupo.trim() ? Math.max(1, parseInt(cupo, 10) || 1) : null,
                  priceMxn: precio.trim() ? Number(precio.replace(/[^\d.]/g, "")) || null : null,
                  visibility: vis === "Abierta" ? "public" : "private",
                });
                if (r.ok) onAprobada(s.id, r);
                return { ok: r.ok, error: r.ok ? undefined : r.error };
              })
            }
          >
            Aprobar · crear salida
          </button>
          <button
            className="adm-btn adm-btn-ghost"
            disabled={ui.pendiente}
            onClick={() => ui.run("Rechazada", () => rejectSlotRequest(s.id))}
          >
            Rechazar
          </button>
        </div>
      </div>
    </details>
  );
}

export default function Solicitudes({ d, nav, ui }: { d: MasMovil; nav: Nav; ui: Ui }) {
  const [bandeja, setBandeja] = useState("Fechas");
  const [aprobadas, setAprobadas] = useState<{ id: string; r: Aprobada }[]>([]);

  const s = d.solicitudes;
  const cnt = { Fechas: s.fecha.length, Operador: s.operador.length, Embajador: s.embajador.length };
  const total = cnt.Fechas + cnt.Operador + cnt.Embajador;
  const opts = (["Fechas", "Operador", "Embajador"] as const).map((t) => (cnt[t] > 0 ? `${t} · ${cnt[t]}` : t));
  const activa = opts.find((o) => o.startsWith(bandeja)) ?? opts[0];

  return (
    <div className="adm-screen">
      <NavBar
        onBack={nav.pop}
        t="Solicitudes"
        s={`${total} pendiente${total === 1 ? "" : "s"}`}
      />
      <div className="adm-pad">
        <Seg opts={opts} val={activa} set={(v) => setBandeja(v.split(" · ")[0])} />
        <Gap />

        {/* Lo aprobado en esta sesión se queda a la vista: el link de un grupo
            privado no vuelve a mostrarse solo. */}
        {aprobadas.length > 0 && (
          <>
            <Sub pad>Recién aprobadas · el link no desaparece</Sub>
            <div className="adm-card" style={{ padding: "14px 16px" }}>
              {aprobadas.map(({ id, r }) => (
                <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
                  <Chip c="ok" dot>
                    {r.visibility === "private" ? "Salida privada creada" : "Salida abierta creada"}
                    {r.yaAprobada ? " · ya estaba aprobada" : ""}
                  </Chip>
                  <CopyBox v={r.link} onCopy={ui.copy} />
                  <CopyBox v={r.waMessage} txt onCopy={ui.copy} />
                </div>
              ))}
            </div>
            <Gap />
          </>
        )}

        {bandeja === "Fechas" &&
          (s.fecha.length === 0 ? (
            <div className="adm-card">
              <Empty
                ic="◌"
                t="Sin solicitudes de fecha"
                p="Cuando alguien pida una fecha desde la web, aparece aquí (y te avisamos por WhatsApp y correo)."
              />
            </div>
          ) : (
            <div className="adm-card">
              {s.fecha.map((x) => (
                <FilaFecha
                  key={x.id}
                  s={x}
                  ui={ui}
                  onAprobada={(id, r) => setAprobadas((a) => [{ id, r }, ...a.filter((y) => y.id !== id)])}
                />
              ))}
            </div>
          ))}

        {bandeja === "Operador" &&
          (s.operador.length === 0 ? (
            <div className="adm-card">
              <Empty
                ic="◌"
                t="Sin solicitudes de acceso"
                p="Quien se registra como operador queda aquí en espera. El acceso al panel nunca es automático."
              />
            </div>
          ) : (
            <div className="adm-card">
              {s.operador.map((o) => (
                <details className="adm-li" key={o.email} open>
                  <summary>
                    <div className="r1">
                      <span className="t">
                        {o.nombre || o.email}
                        <small>{o.nombre ? o.email : "acceso al panel"}</small>
                      </span>
                    </div>
                    <div className="r2">
                      <Chip c="sol">Pendiente · {o.hace}</Chip>
                    </div>
                  </summary>
                  <div className="adm-x">
                    <p className="adm-mut" style={{ fontSize: 12.5, lineHeight: 1.5, padding: "10px 0 2px" }}>
                      Aprobar le da acceso al panel (crear y editar experiencias, cobrar, ver a la gente) y
                      lo da de alta como operador para atribuir sus ventas. Es una decisión deliberada —
                      nadie se nombra admin solo.
                    </p>
                    <div className="adm-acts">
                      <button
                        className="adm-btn adm-btn-orange"
                        disabled={ui.pendiente}
                        onClick={() => ui.run("Acceso concedido", () => approveOperador(o.email))}
                      >
                        Aprobar acceso
                      </button>
                      <button
                        className="adm-btn adm-btn-ghost"
                        disabled={ui.pendiente}
                        onClick={() => ui.run("Rechazada", () => rejectOperador(o.email))}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ))}

        {bandeja === "Embajador" &&
          (s.embajador.length === 0 ? (
            <div className="adm-card">
              <Empty
                ic="◌"
                t="Sin aplicaciones de embajador"
                p="El programa es curado: aplicación → llamada de 30 min → convenio."
              />
            </div>
          ) : (
            <div className="adm-card">
              {s.embajador.map((e) => (
                <details className="adm-li" key={e.id} open>
                  <summary>
                    <div className="r1">
                      <span className="t">
                        {e.nombre}
                        <small>
                          {e.perfil} · {e.email}
                        </small>
                      </span>
                    </div>
                    <div className="r2">
                      <Chip c="sol">Pendiente · {e.hace}</Chip>
                    </div>
                  </summary>
                  <div className="adm-x">
                    <Sub>Su aplicación</Sub>
                    <p style={{ fontSize: 12.5, lineHeight: 1.55, padding: "2px 0 6px" }}>
                      {e.whatsapp ? (
                        <>
                          <span className="adm-mut">WhatsApp:</span> {e.whatsapp}
                          <br />
                        </>
                      ) : null}
                      <span className="adm-mut">Redes:</span> {e.links}
                      {e.experiencia ? (
                        <>
                          <br />
                          <span className="adm-mut">Experiencia:</span> {e.experiencia}
                        </>
                      ) : null}
                      {e.porque ? (
                        <>
                          <br />
                          <span className="adm-mut">Por qué Caminante:</span> {e.porque}
                        </>
                      ) : null}
                      {e.conociste ? (
                        <>
                          <br />
                          <span className="adm-mut">Nos conoció por:</span> {e.conociste}
                        </>
                      ) : null}
                    </p>
                    <p className="adm-mut" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                      Aprobar lo da de alta como aliado para atribuir sus ventas y le manda la bienvenida. No
                      le da acceso al panel. El 30% es sobre utilidad neta y vive en el convenio, no aquí.
                    </p>
                    <div className="adm-acts">
                      <button
                        className="adm-btn adm-btn-orange"
                        disabled={ui.pendiente}
                        onClick={() => ui.run("Aprobado · alta como operador", () => approveEmbajador(e.id))}
                      >
                        Aprobar
                      </button>
                      <button
                        className="adm-btn adm-btn-ghost"
                        disabled={ui.pendiente}
                        onClick={() => ui.run("Rechazada", () => rejectEmbajador(e.id))}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ))}

        <Gap />
        <Sub pad>Histórico</Sub>
        <div className="adm-card">
          {s.historico.length === 0 ? (
            <div className="adm-x">
              <Sub>Todavía no hay nada resuelto.</Sub>
            </div>
          ) : (
            s.historico.map((h, i) => (
              <div className="adm-ros" key={i}>
                <span className={"adm-tick" + (h.ok ? "" : " off")}>{h.ok ? "✓" : "✕"}</span>
                <span className="nm">
                  {h.titulo}
                  <small>{h.sub}</small>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
