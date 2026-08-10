import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import CopyLinkBtn from "./CopyLinkBtn";
import { fetchEventoDetalle, formatMXN, formatFechaCorta } from "@/lib/admin/queries";
import {
  setSlotStatusAction,
  assignOperatorAction,
  createOperatorAction,
  setExperienceStatusAction,
  deleteExperienceAction,
} from "@/lib/admin/eventos-actions";

export const dynamic = "force-dynamic";

// El dashboard OPERA el evento (ocupación, cerrar/reabrir, operador, publicar).
// El contenido y las FECHAS se crean/editan en el formulario de experiencia
// (+ Experiencia / Editar) — así ninguna experiencia nace vacía.
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
                {operadorActual ? `Operador · ${operadorActual.name}` : "Sin operador"}
              </span>
              {ev.precioBase ? <span className="badge">Base · ${ev.precioBase}</span> : null}
              {ev.registroActivo ? <span className="badge">Deslinde activo</span> : null}
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Link
              href={`/caminante/admin/experiencias/${ev.slug}`}
              className="btn btn-orange btn-sm"
            >
              Editar contenido y fechas
            </Link>
            <a
              href={`/caminante/admin/preview/${ev.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-glass btn-sm"
            >
              Vista previa
            </a>
            {/* El Kit ya no vive aquí: la comunicación de cada evento (kit,
                calendario y cola de redes) se opera desde la sección
                «Comunicación» del panel. Este botón lleva ahí. */}
            <a
              href={`/caminante/admin/comunicacion#ev-${ev.slug}`}
              className="btn btn-glass btn-sm"
              title="Comunicación del evento: kit de piezas, captions, calendario y cola de redes — en el panel"
            >
              Comunicación →
            </a>
            {ev.status === "published" ? (
              <a
                href={`/caminante/experiencias/${ev.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-glass btn-sm"
              >
                Ver página en vivo
              </a>
            ) : null}
            <form action={setExperienceStatusAction}>
              <input type="hidden" name="experienceId" value={ev.id} />
              <input type="hidden" name="slug" value={ev.slug} />
              <input
                type="hidden"
                name="status"
                value={ev.status === "published" ? "draft" : "published"}
              />
              <button
                className={ev.status === "published" ? "btn btn-ghost btn-sm" : "btn btn-ghost btn-sm"}
                type="submit"
              >
                {ev.status === "published" ? "Pasar a borrador" : "Publicar"}
              </button>
            </form>
          </div>
        </div>

        {/* Salidas (operación) */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="pad" style={{ paddingBottom: 6 }}>
            <span className="subtitle" style={{ margin: 0 }}>
              Salidas · las fechas se agregan y editan en el formulario de la experiencia
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
                  <th>Encuesta</th>
                  <th>Estado</th>
                  <th className="right">Operación</th>
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
                      {s.encInvitadas ? (
                        <Link
                          href={`/caminante/admin/encuesta#res-${ev.slug.slice(0, 16)}`}
                          className="mono"
                          style={{ fontSize: 12, textDecoration: "underline" }}
                          title="Ver las respuestas de esta salida"
                        >
                          {s.encRespondidas}/{s.encInvitadas}
                          {s.encStars != null ? ` · ${s.encStars}★` : ""}
                        </Link>
                      ) : (
                        <span className="mut" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      {s.pasada ? (
                        <span className="chip c-canc">Pasada</span>
                      ) : s.status === "open" ? (
                        <span className="chip c-conf">Abierta</span>
                      ) : (
                        <span className="chip c-canc">Cerrada</span>
                      )}{" "}
                      {s.visibility === "private" ? <span className="chip c-sol">Privada</span> : null}
                    </td>
                    <td className="right">
                      {s.visibility === "private" && s.accessToken ? (
                        <>
                          <CopyLinkBtn
                            link={`https://caminante.numanhub.com/caminante/experiencias/${ev.slug}?grupo=${s.accessToken}`}
                          />{" "}
                        </>
                      ) : null}
                      <Link href={`/caminante/admin/roster/${s.id}`} className="btn btn-glass btn-sm">
                        Roster
                      </Link>{" "}
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
                            {s.status === "open" ? "Cerrar ventas" : "Reabrir"}
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {ev.slots.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty" style={{ border: 0 }}>
                        Sin salidas aún.{" "}
                        <Link
                          href={`/caminante/admin/experiencias/${ev.slug}`}
                          style={{ textDecoration: "underline" }}
                        >
                          Agrégalas en el formulario de la experiencia
                        </Link>
                        , junto con su contenido.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operador y comisión */}
        <div className="grid2" style={{ marginTop: 20 }}>
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

          <div className="glass pad">
            <span className="subtitle">Cómo funciona</span>
            <p className="mut" style={{ fontSize: 13, lineHeight: 1.6 }}>
              El contenido de la página y las fechas/cupo viven en el formulario de la experiencia
              (&quot;Editar contenido y fechas&quot;). Aquí operas lo del día a día: monitorear
              ocupación, cerrar o reabrir ventas de una salida, asignar operador y publicar. Cerrar
              ventas no borra nada: la salida y sus reservas se conservan.
            </p>
          </div>
        </div>

        {/* Zona de peligro: eliminar (solo experiencias SIN reservas) */}
        <details style={{ marginTop: 26 }}>
          <summary
            className="mut"
            style={{ fontSize: 12.5, cursor: "pointer", color: "#c23c1c" }}
          >
            Eliminar esta experiencia…
          </summary>
          <div
            className="pad"
            style={{
              marginTop: 10,
              border: "1px solid rgba(255,93,54,.35)",
              background: "rgba(255,93,54,.06)",
              borderRadius: "var(--r)",
            }}
          >
            <p className="mut" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              Borra la experiencia y sus salidas <b>para siempre</b> (borrador o publicada). Solo se
              permite si <b>no tiene ninguna reserva</b> — si ya tiene, usa &quot;Pasar a
              borrador&quot; para quitarla del sitio conservando la historia.
            </p>
            <form action={deleteExperienceAction} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input type="hidden" name="experienceId" value={ev.id} />
              <input type="hidden" name="slug" value={ev.slug} />
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input type="checkbox" name="confirmar" value="si" />
                Entiendo que no se puede deshacer
              </label>
              <button className="btn btn-danger btn-sm" type="submit">
                Eliminar experiencia
              </button>
            </form>
          </div>
        </details>
      </section>
    </AdminShell>
  );
}
