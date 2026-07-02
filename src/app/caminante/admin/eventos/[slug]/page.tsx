import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { fetchEventoDetalle, formatMXN, formatFechaCorta } from "@/lib/admin/queries";
import {
  createSlotAction,
  updateSlotAction,
  setSlotStatusAction,
  assignOperatorAction,
  createOperatorAction,
  setExperienceStatusAction,
} from "@/lib/admin/eventos-actions";

export const dynamic = "force-dynamic";

export default async function EventoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { ok, error } = await searchParams;
  const ev = await fetchEventoDetalle(slug);
  if (!ev) notFound();

  const operadorActual = ev.operadores.find((o) => o.id === ev.operatorId) || null;

  return (
    <AdminShell active="eventos">
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
              <span className="sl">{"//"}</span>{" "}
              <Link href="/caminante/admin/eventos" style={{ textDecoration: "underline" }}>
                Eventos
              </Link>
            </span>
            <h1 className="display">{ev.nombre}</h1>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ev.status === "published" ? (
                <span className="chip c-pub">
                  <span className="cd" style={{ background: "var(--olive)" }} />
                  Publicada
                </span>
              ) : (
                <span className="chip c-draft">Borrador</span>
              )}
              <span className="badge">
                {operadorActual
                  ? `Operador · ${operadorActual.name}`
                  : "Sin operador"}
              </span>
              {ev.precioBase ? <span className="badge">Base · ${ev.precioBase}</span> : null}
              {ev.registroActivo ? <span className="badge">Deslinde activo</span> : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <a
              href={`/caminante/experiencias/${ev.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-glass btn-sm"
            >
              Ver página
            </a>
            <form action={setExperienceStatusAction}>
              <input type="hidden" name="experienceId" value={ev.id} />
              <input type="hidden" name="slug" value={ev.slug} />
              <input
                type="hidden"
                name="status"
                value={ev.status === "published" ? "draft" : "published"}
              />
              <button
                className={ev.status === "published" ? "btn btn-ghost btn-sm" : "btn btn-orange btn-sm"}
                type="submit"
              >
                {ev.status === "published" ? "Pasar a borrador" : "Publicar"}
              </button>
            </form>
          </div>
        </div>

        {/* Salidas */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="pad" style={{ paddingBottom: 6 }}>
            <span className="subtitle" style={{ margin: 0 }}>
              Salidas
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Salida</th>
                  <th className="num">Fecha</th>
                  <th className="num">Cupo</th>
                  <th className="num right">Precio</th>
                  <th>Ocupación</th>
                  <th>Estado</th>
                  <th className="right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ev.slots.map((s) => (
                  <tr key={s.id} style={s.pasada ? { opacity: 0.65 } : undefined}>
                    <td style={{ fontWeight: 500 }}>{s.label}</td>
                    <td className="num">{formatFechaCorta(s.startsAt)}</td>
                    <td className="num">{s.capacity ?? "∞"}</td>
                    <td className="num right">
                      {s.priceMxn != null ? formatMXN(s.priceMxn) : <span className="mut">base</span>}
                    </td>
                    <td>
                      <div className="prog" style={{ maxWidth: 170 }}>
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
                          {s.taken}
                          {s.capacity !== null ? `/${s.capacity}` : ""}
                        </span>
                      </div>
                    </td>
                    <td>
                      {s.pasada ? (
                        <span className="chip c-canc">Pasada</span>
                      ) : s.status === "open" ? (
                        <span className="chip c-conf">Abierta</span>
                      ) : (
                        <span className="chip c-canc">Cerrada</span>
                      )}
                    </td>
                    <td className="right">
                      <details style={{ display: "inline-block", textAlign: "left" }}>
                        <summary className="btn btn-ghost btn-sm" style={{ listStyle: "none" }}>
                          Editar
                        </summary>
                        <form
                          action={updateSlotAction}
                          className="mini-form glass pad"
                          style={{ position: "relative", zIndex: 5, marginTop: 8 }}
                        >
                          <input type="hidden" name="slotId" value={s.id} />
                          <input type="hidden" name="slug" value={ev.slug} />
                          <input name="label" defaultValue={s.label} placeholder="Etiqueta" style={{ minWidth: 120 }} />
                          <input name="startsAt" type="datetime-local" defaultValue={s.startsAtInput} />
                          <input
                            name="capacityTotal"
                            type="number"
                            min={0}
                            defaultValue={s.capacity ?? ""}
                            placeholder="Cupo (vacío = sin tope)"
                            style={{ maxWidth: 90 }}
                          />
                          <input
                            name="priceMxn"
                            type="number"
                            min={0}
                            step="0.01"
                            defaultValue={s.priceMxn ?? ""}
                            placeholder="$ (vacío = base)"
                            style={{ maxWidth: 110 }}
                          />
                          <button className="btn btn-orange btn-sm" type="submit">
                            Guardar
                          </button>
                        </form>
                      </details>{" "}
                      {!s.pasada ? (
                        <form action={setSlotStatusAction} style={{ display: "inline-block" }}>
                          <input type="hidden" name="slotId" value={s.id} />
                          <input type="hidden" name="slug" value={ev.slug} />
                          <input
                            type="hidden"
                            name="status"
                            value={s.status === "open" ? "closed" : "open"}
                          />
                          <button
                            className={s.status === "open" ? "btn btn-danger btn-sm" : "btn btn-ghost btn-sm"}
                            type="submit"
                          >
                            {s.status === "open" ? "Cerrar" : "Reabrir"}
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {ev.slots.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty" style={{ border: 0 }}>
                        Sin salidas aún — crea la primera abajo.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nueva salida + Operador */}
        <div className="grid2" style={{ marginTop: 20 }}>
          <div className="glass pad">
            <span className="subtitle">Nueva salida</span>
            <form action={createSlotAction} className="mini-form" style={{ marginTop: 0 }}>
              <input type="hidden" name="experienceId" value={ev.id} />
              <input type="hidden" name="slug" value={ev.slug} />
              <input name="label" placeholder="Etiqueta — ej. Dom 14 sep" required style={{ flex: 1, minWidth: 150 }} />
              <input name="startsAt" type="datetime-local" required />
              <input name="capacityTotal" type="number" min={0} placeholder="Cupo" style={{ maxWidth: 90 }} />
              <input name="priceMxn" type="number" min={0} step="0.01" placeholder="$ / persona" style={{ maxWidth: 110 }} />
              <button className="btn btn-orange btn-sm" type="submit">
                Agregar salida
              </button>
            </form>
            <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>
              Cupo vacío = sin tope. Precio vacío = usa el precio base de la experiencia.
            </p>
          </div>

          <div className="glass pad">
            <span className="subtitle">Operador y comisión</span>
            <form action={assignOperatorAction} className="mini-form" style={{ marginTop: 0 }}>
              <input type="hidden" name="experienceId" value={ev.id} />
              <input type="hidden" name="slug" value={ev.slug} />
              <select name="operatorId" defaultValue={ev.operatorId ?? ""} style={{ flex: 1, minWidth: 140 }}>
                <option value="">Sin asignar</option>
                {ev.operadores.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <input
                name="commissionPct"
                type="number"
                min={0}
                max={100}
                step="0.5"
                defaultValue={operadorActual?.commissionPct ?? ""}
                placeholder="% comisión"
                style={{ maxWidth: 110 }}
              />
              <button className="btn btn-ghost btn-sm" type="submit">
                Guardar
              </button>
            </form>
            <details style={{ marginTop: 12 }}>
              <summary className="mut" style={{ fontSize: 12.5, cursor: "pointer" }}>
                + Crear operador nuevo
              </summary>
              <form action={createOperatorAction} className="mini-form">
                <input type="hidden" name="experienceId" value={ev.id} />
                <input type="hidden" name="slug" value={ev.slug} />
                <input name="name" placeholder="Nombre" required style={{ flex: 1, minWidth: 120 }} />
                <input name="email" type="email" placeholder="Correo" required style={{ flex: 1, minWidth: 150 }} />
                <input name="commissionPct" type="number" min={0} max={100} step="0.5" placeholder="%" style={{ maxWidth: 70 }} />
                <button className="btn btn-orange btn-sm" type="submit">
                  Crear y asignar
                </button>
              </form>
            </details>
            <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>
              La comisión se congela en cada venta al momento de cobrar (no cambia ventas pasadas).
            </p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
