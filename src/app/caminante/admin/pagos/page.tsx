import AdminShell from "../ui/AdminShell";
import { fetchReservas } from "@/lib/admin/queries";
import { formatMXN, formatDiaMes, metodoLabel } from "@/lib/admin/formato";
import type { ReservaAdmin } from "@/lib/admin/queries";
import { registrarPagoManualAction, cancelarReservaAction } from "@/lib/admin/reservas-actions";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagos · Admin — Caminante" };

const estadoChip: Record<string, { clase: string; label: string }> = {
  requested: { clase: "c-sol", label: "Solicitada" },
  confirmed: { clase: "c-conf", label: "Confirmada" },
  partially_paid: { clase: "c-sol", label: "Anticipo" },
  paid: { clase: "c-paid", label: "Pagada" },
  completed: { clase: "c-pub", label: "Completada" },
  cancelled: { clase: "c-canc", label: "Cancelada" },
};

function Row({ r, esCasa }: { r: ReservaAdmin; esCasa: boolean }) {
  const xid = `rv-${r.id.slice(0, 8)}`;
  const chip = estadoChip[r.estado] || { clase: "c-sol", label: r.estado };
  return (
    <>
      <tr className="xhead" data-x={xid}>
        <td style={{ fontWeight: 500 }}>
          {r.contactoNombre} <span className="chev2">▾</span>
        </td>
        <td>
          {r.experienciaNombre} <span className="mut">· {r.salidaLabel}</span>
        </td>
        <td className="num">{r.numPeople}</td>
        <td className="num right">{r.total ? formatMXN(r.total) : "—"}</td>
        <td>
          <span className={`chip ${chip.clase}`}>{chip.label}</span>
        </td>
        <td className="mut">{r.canal === "whatsapp" ? "WhatsApp" : r.canal === "web" ? "Web" : r.canal}</td>
        <td>{r.deslindeFirmado ? <span className="tick">✓</span> : <span className="cross">—</span>}</td>
        <td>
          {r.estado === "paid" || r.estado === "completed" ? (
            <span className="tick">✓</span>
          ) : r.pagado > 0 ? (
            <span className="mut">parcial</span>
          ) : (
            <span className="cross">—</span>
          )}
        </td>
      </tr>
      <tr className="xdetail">
        <td colSpan={8}>
          <div className="xbody" id={xid}>
            <div className="xpad" style={{ padding: "18px 4px" }}>
              <div className="detail">
                <div>
                  <div className="xh4">Contacto</div>
                  <dl className="dl">
                    <dt>Correo</dt>
                    <dd>{r.contactoEmail || "—"}</dd>
                    <dt>WhatsApp</dt>
                    <dd>{r.contactoPhone || "—"}</dd>
                    <dt>Ciudad</dt>
                    <dd>{r.contactoCity || "—"}</dd>
                    <dt>Creada</dt>
                    <dd>{formatDiaMes(r.creada)}</dd>
                    <dt>Deslinde</dt>
                    <dd>{r.deslindeFirmado ? `✓ firmado ${r.deslindeFecha}` : "Pendiente"}</dd>
                  </dl>
                  {r.participantes.length ? (
                    <>
                      <div className="xh4">Participantes</div>
                      <div className="pchips">
                        {r.participantes.map((p, i) => (
                          <span className="pchip ok" key={i}>
                            <span className="av">{p.nombre.slice(0, 1).toUpperCase()}</span>
                            {p.nombre}
                            {p.relacion ? <span className="dt">{p.relacion}</span> : null}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <div>
                  <div className="xh4">Historial de pagos</div>
                  <div className="wlist">
                    {r.pagos.map((p, i) => (
                      <div className="wl" key={i}>
                        <span>{p.nombre}</span>
                        <span className="m" style={p.metodo === "reembolsado" ? { textDecoration: "line-through" } : undefined}>
                          {formatMXN(p.monto)}
                        </span>
                        <span className="me">{metodoLabel(p.metodo === "reembolsado" ? null : p.metodo) || p.metodo}</span>
                        <span className="d">{p.fecha}</span>
                      </div>
                    ))}
                    {!r.pagos.length ? (
                      <div className="wl debt">
                        <span>Sin pagos</span>
                        <span className="m">{r.total ? `debe ${formatMXN(r.total)}` : "—"}</span>
                        <span className="me" />
                        <span className="d" />
                      </div>
                    ) : null}
                    <div className="wl total">
                      <span>Pagado</span>
                      <span className="m">{formatMXN(r.pagado)}</span>
                      <span className="me">faltan</span>
                      <span className="d" style={r.debe > 0 ? { color: "var(--orange)", fontWeight: 600 } : undefined}>
                        {formatMXN(r.debe)}
                      </span>
                    </div>
                  </div>

                  {/* Registrar un pago y cancelar una reserva son acciones de
                      DINERO: siguen siendo de la casa (sus actions exigen
                      isCurrentUserAdmin). Se esconden para el operador porque un
                      botón que rebota se lee como un panel roto, no como un
                      permiso. Si necesita cancelar, lo pide. */}
                  {esCasa && r.estado !== "cancelled" && r.estado !== "completed" ? (
                    <>
                      <div className="xh4">Registrar pago manual</div>
                      <form action={registrarPagoManualAction} className="mini-form">
                        <input type="hidden" name="reservationId" value={r.id} />
                        <input name="monto" type="number" min={1} step="0.01" placeholder="Monto" required style={{ maxWidth: 110 }} />
                        <select name="metodo" defaultValue="transfer">
                          <option value="transfer">Transferencia</option>
                          <option value="cash">Efectivo</option>
                        </select>
                        <input name="fecha" type="date" />
                        <button className="btn btn-ghost btn-sm" type="submit">
                          Registrar
                        </button>
                      </form>
                      <details style={{ marginTop: 12 }}>
                        <summary className="btn btn-danger btn-sm" style={{ listStyle: "none", display: "inline-flex" }}>
                          Cancelar reserva…
                        </summary>
                        <form action={cancelarReservaAction} className="mini-form">
                          <input type="hidden" name="reservationId" value={r.id} />
                          <span className="mut" style={{ fontSize: 12.5 }}>
                            Libera el lugar; los pagos quedan como historial. ¿Segura/o?
                          </span>
                          <button className="btn btn-danger btn-sm" type="submit">
                            Sí, cancelar
                          </button>
                        </form>
                      </details>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ exp?: string; estado?: string; q?: string; ok?: string; error?: string }>;
}) {
  const { exp, estado, q, ok, error } = await searchParams;
  const [{ reservas, experiencias }, esCasa] = await Promise.all([
    fetchReservas({ slug: exp, estado, q }),
    isCurrentUserAdmin(),
  ]);

  return (
    <AdminShell active="recursos">
      <section className="sec">
        {ok ? (
          <div className="glass pad" style={{ marginBottom: 18, fontSize: 13.5, color: "var(--olive-d)" }}>
            {ok}
          </div>
        ) : null}
        {error ? (
          <div
            className="pad"
            style={{
              marginBottom: 18,
              fontSize: 13.5,
              color: "#c23c1c",
              background: "rgba(255,93,54,.08)",
              border: "1px solid rgba(255,93,54,.3)",
              borderRadius: "var(--r)",
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Pagos
            </span>
            <h1 className="display">
              Quién <em className="ac">viene.</em>
            </h1>
            <div className="desc">Toca una fila para el expediente: pagos, participantes y deslinde.</div>
          </div>
        </div>

        <form method="get" className="filters no-print">
          <select name="exp" defaultValue={exp || ""}>
            <option value="">Todas las experiencias</option>
            {experiencias.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.nombre}
              </option>
            ))}
          </select>
          <select name="estado" defaultValue={estado || ""}>
            <option value="">Todos los estados</option>
            <option value="requested">Solicitada</option>
            <option value="confirmed">Confirmada</option>
            <option value="partially_paid">Anticipo</option>
            <option value="paid">Pagada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <input name="q" defaultValue={q || ""} placeholder="Buscar por nombre o correo…" />
          <button className="btn btn-ghost btn-sm" type="submit">
            Filtrar
          </button>
        </form>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Experiencia / salida</th>
                  <th className="num">Pers.</th>
                  <th className="num right">Monto</th>
                  <th>Estado</th>
                  <th>Canal</th>
                  <th>Desl.</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <Row key={r.id} r={r} esCasa={esCasa} />
                ))}
                {reservas.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty" style={{ border: 0 }}>
                        No hay reservas con esos filtros.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>
          {reservas.length} reservas · El pago manual registra cobros hechos por transferencia o
          efectivo (fuera de Stripe). El link de cobro por WhatsApp vive en “Generar cobro”.
        </p>
      </section>
    </AdminShell>
  );
}
