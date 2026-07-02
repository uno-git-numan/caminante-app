import AdminShell from "./ui/AdminShell";
import {
  fetchAdminOverview,
  formatMXN,
  formatDiaMes,
  iniciales,
  type UpcomingSlot,
} from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  admin_no_registro:
    "Estás en modo admin. El registro y la reserva de experiencias son para viajeros — usa una cuenta de caminante si quieres probar ese flujo.",
};

const estadoLabels: Record<string, string> = {
  requested: "solicitadas",
  confirmed: "confirmadas",
  partially_paid: "con anticipo",
  paid: "pagadas",
  completed: "completadas",
  cancelled: "canceladas",
};
const estadoDots: Record<string, string> = {
  paid: "var(--olive)",
  confirmed: "var(--lagoon)",
  partially_paid: "var(--dune)",
  requested: "var(--dune)",
  completed: "var(--sand)",
  cancelled: "var(--sand)",
};

function Stars({ value }: { value: number | null }) {
  if (value == null) return null;
  const full = Math.round(value);
  return (
    <span className="stars-lg">
      {"★".repeat(full)}
      {full < 5 ? <span className="off">{"★".repeat(5 - full)}</span> : null}
    </span>
  );
}

function SalidaRow({ s, pasada = false }: { s: UpcomingSlot; pasada?: boolean }) {
  const xid = `sx-${s.slotId.slice(0, 8)}`;
  const llena = s.available !== null && s.available <= 0;
  const d = s.detail;
  const firmasOk = s.titulares > 0 && s.deslindes >= s.titulares;
  return (
    <>
      <tr className="xhead" data-x={xid}>
        <td className="num">{formatDiaMes(s.startsAt)}</td>
        <td>
          {s.experienceNombre}
          {s.experienceStatus !== "published" ? (
            <>
              {" "}
              <span className="chip c-draft">Borrador</span>
            </>
          ) : null}
        </td>
        <td className="mut">
          {s.label}
          {!pasada && s.slotStatus !== "open" ? (
            <>
              {" "}
              <span className="chip c-canc">Cerrada</span>
            </>
          ) : null}
        </td>
        <td>
          {pasada ? (
            <span>
              {s.taken}
              {s.capacity !== null ? `/${s.capacity}` : ""}{" "}
              <span className="mut">asistieron</span>
            </span>
          ) : s.capacity === null ? (
            <span className="mut">{s.taken} · sin tope</span>
          ) : llena ? (
            <>
              {s.taken}/{s.capacity} · <span className="chip c-full">Llena</span>
            </>
          ) : (
            <>
              {s.taken}/{s.capacity} · <span className="mut">quedan {s.available}</span>
            </>
          )}
        </td>
        <td className="num right">{s.ingresos ? formatMXN(s.ingresos) : "—"}</td>
        <td className="num">
          {s.deslindes}/{s.titulares} <span className="chev2">▾</span>
        </td>
      </tr>
      <tr className="xdetail">
        <td colSpan={6}>
          <div className="xbody" id={xid}>
            <div className="xpad" style={{ padding: "18px 4px 18px" }}>
              <div className="detail">
                <div>
                  <div className="xh4">Registro y deslinde</div>
                  <div className={`prog${firmasOk ? "" : " warn"}`}>
                    <div className="tk2">
                      <i
                        style={{
                          width: `${s.titulares ? Math.round((s.deslindes / s.titulares) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="fr">
                      {s.deslindes}/{s.titulares} firmaron
                    </span>
                  </div>
                  {d.personas.length ? (
                    <>
                      <div className="xh4">Personas</div>
                      <div className="pchips">
                        {d.personas.map((p, i) => (
                          <span key={i} className={`pchip ${p.firmado ? "ok" : "pend"}`}>
                            <span className="av">{iniciales(p.nombre)}</span>
                            {p.nombre.split(" ").slice(0, 2).join(" ")}{" "}
                            <span className="stt">{p.firmado ? "✓" : "Pendiente"}</span>
                            {p.fecha ? <span className="dt">{p.fecha}</span> : null}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>
                      Aún no hay reservas en esta salida.
                    </div>
                  )}
                </div>
                <div>
                  <div className="xh4">Pagos · quién puso qué</div>
                  {d.pagos.length || d.deudores.length ? (
                    <div className="wlist">
                      {d.pagos.map((p, i) => (
                        <div key={i} className="wl">
                          <span>{p.nombre}</span>
                          <span className="m">{formatMXN(p.monto)}</span>
                          <span className="me">{p.metodo}</span>
                          <span className="d">{p.fecha}</span>
                        </div>
                      ))}
                      {d.deudores.map((p, i) => (
                        <div key={`d${i}`} className="wl debt">
                          <span>{p.nombre}</span>
                          <span className="m">debe {formatMXN(p.debe)}</span>
                          <span className="me">pendiente</span>
                          <span className="d">—</span>
                        </div>
                      ))}
                      <div className="wl total">
                        <span>Cobrado</span>
                        <span className="m">{formatMXN(d.cobrado)}</span>
                        <span className="me">faltan</span>
                        <span
                          className="d"
                          style={d.faltante ? { color: "var(--orange)", fontWeight: 600 } : undefined}
                        >
                          {formatMXN(d.faltante)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mut" style={{ fontSize: 12.5 }}>
                      Sin pagos registrados aún. Los cobros hechos fuera del sistema se podrán
                      capturar como pago manual (sección Reservas, pronto).
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const noticeText = notice ? notices[notice] : null;
  const { kpis, proximas, pasadas } = await fetchAdminOverview();
  const sat = kpis.satisfaccion;

  const maxExp = Math.max(1, ...kpis.ingresosPorExperiencia.map((e) => e.monto));
  const maxMes = Math.max(1, ...kpis.sparkMeses);
  const tasa = sat.invitadas ? Math.round((sat.respondidas / sat.invitadas) * 100) : 0;
  const pendientesFirma = proximas.reduce((n, s) => n + Math.max(0, s.titulares - s.deslindes), 0);
  const maxDist = Math.max(1, ...sat.distEstrellas.map((d) => d.n));

  return (
    <AdminShell active="panorama">
      {noticeText ? (
        <div
          className="glass pad"
          style={{ marginBottom: 20, fontSize: 13.5, color: "var(--ink-soft)" }}
        >
          {noticeText}
        </div>
      ) : null}

      <section className="sec" id="panorama">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Panorama
            </span>
            <h1 className="display">
              Tu operación, <em className="ac">en vivo.</em>
            </h1>
          </div>
          <span className="mut" style={{ fontSize: 13 }}>
            {kpis.mesLabel} · toca cualquier dato para desarrollarlo
          </span>
        </div>

        <div className="kpis">
          {/* KPI 1 · Ingresos */}
          <div className="kpi glass xhead" data-x="kx1">
            <div className="k-lbl">
              Ingresos del mes <span className="chev2">▾</span>
            </div>
            <div className="k-val">{formatMXN(kpis.ingresosMes)}</div>
            <div className="k-sub">
              Histórico: <b>{formatMXN(kpis.ingresosTotal)}</b>
            </div>
            <div className="spark">
              {kpis.sparkMeses.map((m, i) => (
                <i
                  key={i}
                  className={i === kpis.sparkMeses.length - 1 ? "hi" : ""}
                  style={{ height: `${Math.max(8, Math.round((m / maxMes) * 100))}%` }}
                />
              ))}
            </div>
            <div className="xbody" id="kx1">
              <div className="xpad">
                <div className="xh4">Por experiencia</div>
                {kpis.ingresosPorExperiencia.length ? (
                  kpis.ingresosPorExperiencia.map((e, i) => (
                    <div key={i} className="progrow">
                      <span>{e.nombre}</span>
                      <div className="prog">
                        <div className="tk2">
                          <i style={{ width: `${Math.round((e.monto / maxExp) * 100)}%` }} />
                        </div>
                        <span className="fr">{formatMXN(e.monto)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mut" style={{ fontSize: 12.5 }}>
                    Sin pagos registrados aún.
                  </div>
                )}
                {kpis.ultimosPagos.length ? (
                  <>
                    <div className="xh4">Últimos pagos</div>
                    <div className="wlist">
                      {kpis.ultimosPagos.map((p, i) => (
                        <div key={i} className="wl">
                          <span>{p.nombre}</span>
                          <span className="m">{formatMXN(p.monto)}</span>
                          <span className="me">{p.metodo}</span>
                          <span className="d">{p.fecha}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* KPI 2 · Personas */}
          <div className="kpi glass xhead" data-x="kx2">
            <div className="k-lbl">
              Personas apuntadas <span className="chev2">▾</span>
            </div>
            <div className="k-val">{kpis.personasApuntadas}</div>
            <div className="dots">
              {Object.entries(kpis.reservasPorEstado)
                .filter(([k, n]) => n > 0 && k !== "cancelled")
                .map(([k, n]) => (
                  <span key={k} className="dot-l">
                    <span className="dot" style={{ background: estadoDots[k] || "var(--sand)" }} />
                    {n} {estadoLabels[k] || k}
                  </span>
                ))}
            </div>
            <div className="xbody" id="kx2">
              <div className="xpad">
                <div className="xh4">Por salida</div>
                {proximas.length ? (
                  proximas.map((s) => (
                    <div key={s.slotId} className="progrow">
                      <span>
                        {s.experienceNombre.split(" ")[0]} · {s.label}
                      </span>
                      <div className="prog">
                        <div className="tk2">
                          <i
                            style={{
                              width:
                                s.capacity === null
                                  ? "100%"
                                  : `${Math.min(100, Math.round((s.taken / Math.max(1, s.capacity)) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="fr">
                          {s.capacity === null ? `${s.taken} · sin tope` : `${s.taken}/${s.capacity}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mut" style={{ fontSize: 12.5 }}>
                    No hay salidas próximas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPI 3 · Deslindes */}
          <div className="kpi glass xhead" data-x="kx3">
            <div className="k-lbl">
              Deslindes firmados <span className="chev2">▾</span>
            </div>
            <div className="k-val">{kpis.deslindesFirmados}</div>
            <div className="k-sub">
              {pendientesFirma ? (
                <>
                  <b>{pendientesFirma}</b> pendientes en próximas salidas
                </>
              ) : (
                "Nada pendiente en próximas salidas"
              )}
            </div>
            <div className="xbody" id="kx3">
              <div className="xpad">
                <div className="xh4">Firmas por salida</div>
                {proximas.filter((s) => s.titulares > 0).length ? (
                  proximas
                    .filter((s) => s.titulares > 0)
                    .map((s) => (
                      <div key={s.slotId} className="progrow">
                        <span>
                          {s.experienceNombre.split(" ")[0]} · {s.label}
                        </span>
                        <div className={`prog${s.deslindes >= s.titulares ? "" : " warn"}`}>
                          <div className="tk2">
                            <i
                              style={{
                                width: `${Math.round((s.deslindes / s.titulares) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="fr">
                            {s.deslindes}/{s.titulares}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="mut" style={{ fontSize: 12.5 }}>
                    Sin reservas en salidas próximas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPI 4 · Satisfacción */}
          <div className="kpi glass xhead" data-x="kx4">
            <div className="k-lbl">
              Satisfacción <span className="chev2">▾</span>
            </div>
            <div className="k-val" style={{ fontSize: 26 }}>
              {sat.avgStars != null ? sat.avgStars.toLocaleString("es-MX") : "—"}{" "}
              <Stars value={sat.avgStars} />
            </div>
            <div className="k-sub">
              {sat.respondidas ? (
                <>
                  <b>NPS {sat.avgNps ?? "—"}</b> · tasa de respuesta <b>{tasa}%</b>
                </>
              ) : (
                "Sin respuestas aún"
              )}
            </div>
            <div className="xbody" id="kx4">
              <div className="xpad">
                <div className="xh4">Distribución · {sat.respondidas} respuestas</div>
                {sat.distEstrellas.map((d, i) => (
                  <div key={i} className="progrow">
                    <span>{d.etiqueta}</span>
                    <div className="prog">
                      <div className="tk2">
                        <i style={{ width: `${Math.round((d.n / maxDist) * 100)}%` }} />
                      </div>
                      <span className="fr">{d.n}</span>
                    </div>
                  </div>
                ))}
                {sat.ultimas.length ? (
                  <>
                    <div className="xh4">Últimas respuestas</div>
                    <div className="wlist">
                      {sat.ultimas.map((u, i) => (
                        <div key={i} className="wl">
                          <span>{u.texto}</span>
                          <span className="m" style={{ color: "var(--orange)" }}>
                            ★ {u.stars ?? "—"}
                          </span>
                          <span className="me"></span>
                          <span className="d">{u.fecha}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Próximas salidas */}
        <div className="card" style={{ marginTop: 24, overflow: "hidden" }}>
          <div className="pad" style={{ paddingBottom: 6 }}>
            <span className="subtitle" style={{ margin: 0 }}>
              Próximas salidas · toca una fila para el detalle
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th className="num">Fecha</th>
                  <th>Experiencia</th>
                  <th>Salida</th>
                  <th>Ocupación</th>
                  <th className="right">Ingresos</th>
                  <th>Deslindes</th>
                </tr>
              </thead>
              <tbody>
                {proximas.map((s) => (
                  <SalidaRow key={s.slotId} s={s} />
                ))}
                {proximas.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty" style={{ border: 0 }}>
                        No hay salidas programadas.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salidas pasadas */}
        {pasadas.length ? (
          <div className="card" style={{ marginTop: 24, overflow: "hidden" }}>
            <div className="pad" style={{ paddingBottom: 6 }}>
              <span className="subtitle" style={{ margin: 0 }}>
                Salidas pasadas · toca una fila para el detalle
              </span>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="num">Fecha</th>
                    <th>Experiencia</th>
                    <th>Salida</th>
                    <th>Asistencia</th>
                    <th className="right">Ingresos</th>
                    <th>Deslindes</th>
                  </tr>
                </thead>
                <tbody>
                  {pasadas.map((s) => (
                    <SalidaRow key={s.slotId} s={s} pasada />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
