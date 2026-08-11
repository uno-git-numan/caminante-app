import AdminShell from "../ui/AdminShell";
import { fetchDinero, formatMXN } from "@/lib/admin/queries";
import { fetchExperienciasConSalidas } from "@/lib/admin/transferencias";
import TransferenciaForm from "./TransferenciaForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dinero · Admin — Caminante" };

export default async function DineroPage() {
  const [d, experiencias] = await Promise.all([fetchDinero(), fetchExperienciasConSalidas()]);
  const maxExp = Math.max(1, ...d.porExperiencia.map((e) => e.monto));
  const maxSpark = Math.max(1, ...d.sparkMeses);

  return (
    <AdminShell active="dinero">
      <section className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Dinero
            </span>
            <h1 className="display">
              Las <em className="ac">cuentas.</em>
            </h1>
            <div className="desc">Toca un renglón para el detalle de dónde sale cada peso.</div>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpis">
          <div className="kpi glass">
            <div className="k-lbl">Ingresos · {d.mesLabel}</div>
            <div className="k-val">{formatMXN(d.ingresosMes)}</div>
          </div>
          <div className="kpi glass">
            <div className="k-lbl">Histórico</div>
            <div className="k-val">{formatMXN(d.ingresosTotal)}</div>
            <div className="spark">
              {d.sparkMeses.map((v, i) => (
                <i
                  key={i}
                  className={i === d.sparkMeses.length - 1 ? "hi" : undefined}
                  style={{ height: `${Math.max(6, (v / maxSpark) * 100)}%` }}
                />
              ))}
            </div>
          </div>
          <div className="kpi glass">
            <div className="k-lbl">Pendiente de cobro</div>
            <div className="k-val">{formatMXN(d.pendiente)}</div>
            <div className="k-sub">
              {d.pendienteN ? (
                <>
                  <b>{d.pendienteN}</b> reservas por liquidar
                </>
              ) : (
                "Nada pendiente"
              )}
            </div>
          </div>
          <div className="kpi glass">
            <div className="k-lbl">Reembolsos · {d.mesLabel}</div>
            <div className="k-val">{formatMXN(d.reembolsosMes)}</div>
            <div className="k-sub">
              {d.reembolsosN ? (
                <>
                  <b>{d.reembolsosN}</b> reembolsos
                </>
              ) : (
                "Sin reembolsos"
              )}
            </div>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 22 }}>
          {/* Ingresos por experiencia */}
          <div className="card pad">
            <span className="subtitle">Ingresos por experiencia · toca para el detalle</span>
            {d.porExperiencia.map((e, i) => {
              const xid = `dx-${i}`;
              return (
                <div key={e.nombre}>
                  <div className="xhead" data-x={xid}>
                    <div className="barrow">
                      <span>{e.nombre}</span>
                      <div className="bar">
                        <i style={{ width: `${(e.monto / maxExp) * 100}%` }} />
                      </div>
                      <span className="bv">
                        {formatMXN(e.monto)} <span className="chev2">▾</span>
                      </span>
                    </div>
                  </div>
                  <div className="xbody" id={xid}>
                    <div className="xpad" style={{ paddingTop: 6 }}>
                      <div className="wlist">
                        {e.detalle.map((s, j) => (
                          <div className="wl" key={j}>
                            <span>
                              {s.salida} <span className="mut">· {s.personas} pers.</span>
                            </span>
                            <span className="m">{formatMXN(s.monto)}</span>
                            <span className="me" />
                            <span className="d" />
                          </div>
                        ))}
                        <div className="wl total">
                          <span>Total {e.nombre}</span>
                          <span className="m">{formatMXN(e.monto)}</span>
                          <span className="me" />
                          <span className="d" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {!d.porExperiencia.length ? <div className="empty">Sin ingresos aún.</div> : null}
          </div>

          {/* Payout por operador */}
          <div className="card pad">
            <span className="subtitle">Payout por operador · toca para el cálculo</span>
            {d.payouts.map((p, i) => {
              const xid = `px-${i}`;
              return (
                <div key={p.operador} style={i ? { marginTop: 14 } : undefined}>
                  <div className="xhead" data-x={xid}>
                    <dl className="dl" style={{ gridTemplateColumns: "auto 1fr" }}>
                      <dt>Bruto · {p.operador}</dt>
                      <dd>{formatMXN(p.bruto)}</dd>
                      <dt>Comisión Caminante</dt>
                      <dd style={{ color: p.comision ? "var(--orange)" : undefined }}>
                        {p.comision ? `− ${formatMXN(p.comision)}` : ""}
                        {p.brutoSinPct ? (
                          <span className="mut">
                            {p.comision ? " · " : ""}por definir sobre {formatMXN(p.brutoSinPct)}
                          </span>
                        ) : null}
                      </dd>
                      <dt
                        style={{
                          borderTop: "1px solid var(--line)",
                          paddingTop: 8,
                          fontWeight: 600,
                          color: "var(--charcoal)",
                        }}
                      >
                        Neto <span className="chev2">▾</span>
                      </dt>
                      <dd style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                        {p.neto != null ? (
                          formatMXN(p.neto)
                        ) : (
                          <span style={{ color: "var(--orange)", fontWeight: 600 }}>
                            {p.sinAtribuir ? "no se paga · falta atribuir" : "sin definir"}
                          </span>
                        )}
                      </dd>
                    </dl>
                  </div>
                  <div className="xbody" id={xid}>
                    <div className="xpad" style={{ paddingTop: 8 }}>
                      <div className="xh4">Cálculo completo</div>
                      <div className="wlist">
                        {p.lineas.map((l, j) => (
                          <div className="wl" key={j}>
                            <span>{l.concepto}</span>
                            <span className="m">{formatMXN(l.monto)}</span>
                            <span className="me">{l.nota}</span>
                            <span className="d" />
                          </div>
                        ))}
                        <div className="wl total">
                          <span>Neto a depositar</span>
                          <span className="m">{p.neto != null ? formatMXN(p.neto) : "—"}</span>
                          <span className="me">{p.email}</span>
                          <span className="d" />
                        </div>
                      </div>
                      {p.sinAtribuir ? (
                        <p style={{ fontSize: 12, marginTop: 8, color: "var(--orange)" }}>
                          Estas ventas no tienen operador asignado, así que no entran en ningún
                          payout. Asígnales operador en Eventos para que dejen de estar fuera de la
                          cuenta.
                        </p>
                      ) : p.brutoSinPct ? (
                        <p style={{ fontSize: 12, marginTop: 8, color: "var(--orange)" }}>
                          No hay neto porque {formatMXN(p.brutoSinPct)} de este bruto se vendió sin
                          comisión congelada. Define la comisión del operador para las ventas futuras;
                          las pasadas se acuerdan a mano — el sistema no las va a adivinar.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {!d.payouts.length ? <div className="empty">Sin ventas atribuidas a operadores aún.</div> : null}
          </div>
        </div>

        {/* Pago fuera de Stripe: la cuarta puerta de venta, la única que se
            captura a mano. Va colapsada tras un botón — es una acción puntual,
            no algo que se mire todos los días. */}
        <div style={{ marginTop: 20 }}>
          <TransferenciaForm experiencias={experiencias} />
        </div>

        {/* Ledger */}
        <div className="card" style={{ marginTop: 20, overflow: "hidden" }}>
          <div className="pad" style={{ paddingBottom: 6 }}>
            <span className="subtitle" style={{ margin: 0 }}>
              Ledger de pagos
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th className="num">Fecha</th>
                  <th>Persona</th>
                  <th>Método</th>
                  <th className="right">Monto</th>
                  <th>Estado</th>
                  <th>Respaldo</th>
                </tr>
              </thead>
              <tbody>
                {d.ledger.map((l, i) => (
                  <tr key={i} className={l.estado === "refunded" ? "mut" : undefined}>
                    <td className="num">{l.fecha}</td>
                    <td>{l.persona}</td>
                    <td className="mut">{l.metodo}</td>
                    <td
                      className="num right"
                      style={l.estado === "refunded" ? { textDecoration: "line-through" } : undefined}
                    >
                      {formatMXN(l.monto)}
                    </td>
                    <td>
                      {l.estado === "paid" ? (
                        <span className="chip c-paid">Pagado</span>
                      ) : l.estado === "refunded" ? (
                        <span className="chip c-canc">Reembolsado</span>
                      ) : (
                        <span className="chip c-sol">{l.estado}</span>
                      )}
                    </td>
                    <td className="mut" style={{ fontSize: 12 }}>
                      {l.referencia ? <span>ref. {l.referencia}</span> : null}
                      {l.comprobantePath ? (
                        <>
                          {l.referencia ? " · " : null}
                          {/* Liga a una URL FIRMADA de 5 min: el bucket es privado. */}
                          <a
                            href={`/caminante/api/admin/comprobante?path=${encodeURIComponent(l.comprobantePath)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            comprobante
                          </a>
                        </>
                      ) : null}
                      {!l.referencia && !l.comprobantePath ? "—" : null}
                    </td>
                  </tr>
                ))}
                {!d.ledger.length ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty" style={{ border: 0 }}>
                        Sin pagos registrados.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        {/* Puente explícito: Dinero responde «cuánto entró», Rentabilidad
            responde «cuánto es mío». Son dos preguntas distintas y la segunda
            se estaba perdiendo. */}
        <div className="card pad" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <span className="subtitle" style={{ margin: 0 }}>Rentabilidad por salida</span>
            <p className="mut" style={{ fontSize: 12.5, margin: "4px 0 0" }}>
              Esta página dice cuánto <b>entró</b>. La otra dice cuánto es <b>tuyo</b>: la escalera
              ingreso → IVA → Stripe → proveedores → utilidad, salida por salida, con su punto de
              equilibrio.
            </p>
          </div>
          <a href="/caminante/admin/rentabilidad" className="btn btn-glass btn-sm">
            Ver rentabilidad →
          </a>
        </div>

        {/* Facturación CFDI: se opera desde aquí (movida del nav a Dinero). */}
        <div className="card pad" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <span className="subtitle" style={{ margin: 0 }}>Facturación CFDI</span>
            <p className="mut" style={{ fontSize: 12.5, margin: "4px 0 0" }}>
              Lo emitido y lo que sigue por-emitir, con descarga de XML/PDF. Los clientes facturan solos
              en la autofactura pública.
            </p>
          </div>
          <a href="/caminante/admin/facturacion" className="btn btn-glass btn-sm">
            Abrir facturación →
          </a>
        </div>

        <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>
          Los ingresos excluyen reembolsos. La comisión usa el % congelado en cada venta.
        </p>
      </section>
    </AdminShell>
  );
}
