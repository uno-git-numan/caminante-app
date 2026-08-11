import AdminShell from "../ui/AdminShell";
import { fetchEncuestaAdmin, iniciales } from "@/lib/admin/queries";
import type { EncuestaExperiencia } from "@/lib/admin/queries";
import { setTestimonioAction } from "@/lib/admin/encuesta-actions";
import {
  reenviarEncuesta,
  reenviarEncuestaPendientes,
  reenviarEncuestaTodos,
  reenviarDeslinde,
  reenviarDeslindesTodos,
} from "@/lib/feedback/resend-actions";
import { generarLinkEncuestaSalida, linkAbierto } from "@/lib/feedback/link-abierto";
import { fetchSalidasParaLinkAbierto } from "@/lib/admin/queries";
import { fetchDeslindesPendientes } from "@/lib/registration/pending";
import type { DeslindePendiente } from "@/lib/registration/pending";
import ConfirmSubmit from "../ui/ConfirmSubmit";
import RespuestasExp from "./RespuestasExp";

export const dynamic = "force-dynamic";
// Envío en lote (reintentos + espaciado anti rate-limit) puede tardar; súbelo del
// default de 10s. Hobby lo topa en 60s, suficiente para las tandas actuales.
export const maxDuration = 60;
export const metadata = { title: "Encuesta · Admin — Caminante" };

function Stars({ v }: { v: number | null }) {
  if (v == null) return <span className="mut">—</span>;
  const llenas = Math.round(v);
  return (
    <span className="stars-lg">
      {"★".repeat(Math.min(5, llenas))}
      <span className="off">{"★".repeat(Math.max(0, 5 - llenas))}</span>
    </span>
  );
}

// ── Menú (acordeón) por experiencia: cabecera con conteo + cuerpo colapsable ──
function ExpMenu({
  id,
  nombre,
  ubicacion,
  faltan,
  right,
  children,
}: {
  id: string;
  nombre: string;
  ubicacion?: string | null;
  faltan: number;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: 10 }}>
      <div className="pad xhead" data-x={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {nombre} <span className="chev2">▾</span>
          </div>
          <div className="mut" style={{ fontSize: 12.5 }}>
            {ubicacion ? `${ubicacion} · ` : ""}
            <b style={{ color: faltan ? "var(--orange)" : "var(--olive)" }}>{faltan}</b> por completar
          </div>
        </div>
        {right}
      </div>
      <div className="xbody" id={id}>
        <div className="xpad">{children}</div>
      </div>
    </div>
  );
}

export default async function EncuestaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; link?: string }>;
}) {
  const { ok, error, link } = await searchParams;
  const [{ experiencias, testimoniosPendientes }, deslindesPend] = await Promise.all([
    fetchEncuestaAdmin(),
    fetchDeslindesPendientes(),
  ]);

  // Deslindes pendientes agrupados por experiencia
  const deslindePorExp = new Map<string, { nombre: string; items: DeslindePendiente[] }>();
  for (const d of deslindesPend) {
    const g = deslindePorExp.get(d.slug) || { nombre: d.experiencia, items: [] };
    g.items.push(d);
    deslindePorExp.set(d.slug, g);
  }

  // Satisfacción: experiencias con pendientes de responder / con respuestas
  const conPendientes = experiencias
    .map((e) => ({ e, pend: e.personas.filter((p) => p.estado === "invitada") }))
    .filter((x) => x.pend.length);
  const encuestasPend = conPendientes.reduce((n, x) => n + x.pend.length, 0);
  const conRespuestas = experiencias.filter((e) => e.respondidas > 0);
  const salidasLink = await fetchSalidasParaLinkAbierto();

  return (
    <AdminShell active="encuesta">
      {/* .xbody topa en 1600px de alto. Con 12 respuestas + el desglose por
          categoría, la tarjeta ya no cabía y se cortaba por abajo. */}
      <style dangerouslySetInnerHTML={{ __html: ".adm .card>.xbody.on{max-height:6000px;}" }} />
      <section className="sec">
        {ok ? (
          <div className="glass pad" style={{ marginBottom: 18, fontSize: 13.5, color: "var(--olive-d)" }}>{ok}</div>
        ) : null}
        {error ? (
          <div className="pad" style={{ marginBottom: 18, fontSize: 13.5, color: "#c23c1c", background: "rgba(255,93,54,.08)", border: "1px solid rgba(255,93,54,.3)", borderRadius: "var(--r)" }}>
            {error}
          </div>
        ) : null}

        <div className="sec-head">
          <div>
            <span className="eyebrow"><span className="sl">{"//"}</span> Encuesta</span>
            <h1 className="display">Cómo se <em className="ac">fueron.</em></h1>
            <div className="desc">Organizado por tipo y por experiencia: quién falta de firmar, quién falta de responder, y qué dijeron.</div>
          </div>
        </div>

        {link ? (
          <div className="glass pad" style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}><span className="sl">{"//"}</span> Link para el grupo</div>
            <code className="mono" style={{ fontSize: 13, wordBreak: "break-all", display: "block" }}>{link}</code>
            <div className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>
              Cópialo y mándalo al grupo de WhatsApp. Sirve para acompañantes y para quien no vio el correo:
              pide nombre y correo, y cada quien contesta en su propia hoja (nadie se pisa).
            </div>
          </div>
        ) : null}

        {/* ══════════ ⓪ LINK ABIERTO POR SALIDA ══════════ */}
        <div className="sec-head" style={{ marginTop: 6 }}>
          <div>
            <span className="eyebrow"><span className="sl">{"//"}</span> Encuesta del grupo</span>
            <div className="subtitle" style={{ margin: "4px 0 0" }}>
              El correo personal sale solo 24 h después de cada salida. Este link es la <b>segunda puerta</b>:
              lo mandas al grupo para los que fueron de acompañantes o no vieron el correo.
            </div>
          </div>
        </div>
        {salidasLink.length === 0 ? (
          <div className="empty">No hay salidas terminadas con encuesta activa.</div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Salida</th><th>Experiencia</th><th>Respuestas</th><th></th></tr></thead>
              <tbody>
                {salidasLink.map((sl) => (
                  <tr key={sl.id}>
                    <td>{sl.label}</td>
                    <td className="mut">{sl.experiencia}</td>
                    <td className="mono">{sl.respuestas}</td>
                    <td style={{ textAlign: "right" }}>
                      {sl.token ? (
                        <code className="mono" style={{ fontSize: 12, wordBreak: "break-all" }}>{`/caminante/feedback/salida/${sl.token}`}</code>
                      ) : (
                        <form action={generarLinkEncuestaSalida}>
                          <input type="hidden" name="slotId" value={sl.id} />
                          <button type="submit" className="btn btn-glass btn-sm">Generar link de grupo</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══════════ ① DESLINDE ══════════ */}
        <div className="sec-head" style={{ marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", width: "100%" }}>
            <div>
              <span className="eyebrow"><span className="sl">{"//"}</span> Deslinde</span>
              <div className="subtitle" style={{ margin: "4px 0 0" }}>
                Quién pagó y falta firmar. {deslindesPend.length ? <b>{deslindesPend.length} pendientes.</b> : "Todo firmado ✓"}
              </div>
            </div>
            {deslindesPend.length ? (
              <form action={reenviarDeslindesTodos}>
                <ConfirmSubmit className="btn btn-orange btn-sm" message={`Vas a mandar el recordatorio de deslinde a ${deslindesPend.length} ${deslindesPend.length === 1 ? "persona" : "personas"}. ¿Seguro?`}>
                  ✉ Recordar a todos
                </ConfirmSubmit>
              </form>
            ) : null}
          </div>
        </div>
        {deslindesPend.length === 0 ? (
          <div className="empty">Sin deslindes pendientes.</div>
        ) : (
          [...deslindePorExp.entries()].map(([slug, g]) => (
            <ExpMenu key={slug} id={`des-${slug.slice(0, 16)}`} nombre={g.nombre} faltan={g.items.length}>
              <div className="pchips">
                {g.items.map((d) => (
                  <span key={d.reservationId} className="pchip pend" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="av">{iniciales(d.nombre)}</span>
                    {d.nombre}
                    {d.salidaLabel ? <span className="dt">{d.salidaLabel}</span> : null}
                    {d.email ? (
                      <form action={reenviarDeslinde} style={{ display: "inline" }}>
                        <input type="hidden" name="reservationId" value={d.reservationId} />
                        <button type="submit" className="btn btn-glass btn-sm" title={`Recordar deslinde a ${d.email}`} style={{ padding: "3px 9px", fontSize: 11.5 }}>✉ Recordar</button>
                      </form>
                    ) : (
                      <a href={`/caminante/registro/${d.slug}?reserva=${d.reservationId}`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm" style={{ padding: "3px 9px", fontSize: 11.5 }}>Abrir link</a>
                    )}
                  </span>
                ))}
              </div>
            </ExpMenu>
          ))
        )}

        {/* ══════════ ② SATISFACCIÓN ══════════ */}
        <div className="sec-head" style={{ marginTop: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", width: "100%" }}>
            <div>
              <span className="eyebrow"><span className="sl">{"//"}</span> Satisfacción</span>
              <div className="subtitle" style={{ margin: "4px 0 0" }}>
                Quién falta de responder y qué dijeron los que ya respondieron.
              </div>
            </div>
            {encuestasPend ? (
              <form action={reenviarEncuestaTodos}>
                <ConfirmSubmit className="btn btn-orange btn-sm" message={`Vas a mandar la encuesta a ${encuestasPend} ${encuestasPend === 1 ? "persona pendiente" : "personas pendientes"}. ¿Seguro?`}>
                  ✉ Recordar encuesta a todos
                </ConfirmSubmit>
              </form>
            ) : null}
          </div>
        </div>

        {/* Quién falta de responder (menú por experiencia) */}
        <div className="xh4" style={{ marginTop: 4 }}>Quién falta de responder</div>
        {conPendientes.length === 0 ? (
          <div className="empty">Nadie pendiente. Todas las encuestas enviadas ya se respondieron.</div>
        ) : (
          conPendientes.map(({ e, pend }) => (
            <ExpMenu
              key={e.experienceId}
              id={`pen-${e.slug.slice(0, 16)}`}
              nombre={e.nombre}
              ubicacion={e.ubicacion}
              faltan={pend.length}
              right={
                <form action={reenviarEncuestaPendientes}>
                  <input type="hidden" name="experienceId" value={e.experienceId} />
                  <ConfirmSubmit className="btn btn-glass btn-sm" message={`Reenviar la encuesta a los ${pend.length} pendientes de ${e.nombre}. ¿Seguro?`}>
                    ✉ Reenviar a todos
                  </ConfirmSubmit>
                </form>
              }
            >
              <div className="pchips">
                {pend.map((p, i) => (
                  <span key={i} className="pchip pend" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <a href={`/caminante/feedback/${p.token}`} target="_blank" rel="noopener noreferrer" title="Abrir su encuesta — copia el link" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "inherit" }}>
                      <span className="av">{iniciales(p.nombre)}</span>
                      {p.nombre}
                      {p.salidaLabel ? <span className="dt">{p.salidaLabel}</span> : null}
                    </a>
                    {p.email ? (
                      <form action={reenviarEncuesta} style={{ display: "inline" }}>
                        <input type="hidden" name="feedbackId" value={p.id} />
                        <button type="submit" className="btn btn-glass btn-sm" title={`Reenviar la encuesta a ${p.email}`} style={{ padding: "3px 9px", fontSize: 11.5 }}>✉ Reenviar</button>
                      </form>
                    ) : null}
                  </span>
                ))}
              </div>
            </ExpMenu>
          ))
        )}

        {/* Respuestas por experiencia (filtro por estrellas) */}
        <div className="xh4" style={{ marginTop: 26 }}>Respuestas</div>
        {conRespuestas.length === 0 ? (
          <div className="empty">Aún nadie responde. Las respuestas aparecerán aquí.</div>
        ) : (
          conRespuestas.map((e: EncuestaExperiencia) => {
            const tasa = e.invitadas ? Math.round((e.respondidas / e.invitadas) * 100) : 0;
            const rid = `res-${e.slug.slice(0, 16)}`;
            // `secciones` ya viene ordenada de mejor a peor desde queries.ts.
            // La peor solo se anuncia si de verdad está floja: por debajo de 4
            // y con al menos 3 respuestas, para no colgar una alarma de un voto.
            const peor = e.secciones[e.secciones.length - 1];
            const floja = peor && peor.avg < 4 && peor.n >= 3 ? peor : null;
            const sid = `sec-${e.slug.slice(0, 16)}`;
            // Si todas las categorías tienen el mismo n, repetirlo siete veces es
            // ruido: se dice una vez arriba.
            const mismoN = e.secciones.every((x) => x.n === e.secciones[0].n);
            return (
              <div className="card" key={e.experienceId} style={{ overflow: "hidden", marginBottom: 10 }}>
                <div className="pad xhead" data-x={rid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {e.nombre} <span className="chev2">▾</span>
                    </div>
                    <div className="mut" style={{ fontSize: 12.5 }}>
                      {e.ubicacion ? `${e.ubicacion} · ` : ""}
                      {e.respondidas} {e.respondidas === 1 ? "respuesta" : "respuestas"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5 }}>
                    {floja ? (
                      <span className="mut" title="La categoría peor calificada de esta experiencia">
                        más flojo{" "}
                        <b style={{ color: "var(--orange)" }}>
                          {floja.label.toLowerCase()} {floja.avg}★
                        </b>
                      </span>
                    ) : null}
                    <span><Stars v={e.avgStars} /> <b>{e.avgStars ?? "—"}</b></span>
                    <span className="mut">NPS <b style={{ color: "var(--charcoal)" }}>{e.avgNps ?? "—"}</b></span>
                    <span className="mut">tasa <b style={{ color: "var(--charcoal)" }}>{tasa}%</b></span>
                  </div>
                </div>
                <div className="xbody" id={rid}>
                  <div className="xpad">
                    {e.secciones.length ? (
                      <div style={{ marginBottom: 16 }}>
                        <div className="xh4 xhead" data-x={sid} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span>
                            Por categoría <span className="chev2">▾</span>
                          </span>
                          <span className="mut" style={{ fontSize: 12, fontWeight: 400 }}>
                            {e.secciones.length} categorías{mismoN ? ` · ${e.secciones[0].n} respuestas cada una` : ""}
                          </span>
                        </div>
                        <div className="xbody" id={sid}>
                          <div className="xpad" style={{ paddingTop: 8 }}>
                            {[...e.secciones].reverse().map((sec, i) => (
                              <div className="progrow" key={sec.label} style={{ gridTemplateColumns: "190px 1fr" }}>
                                <span style={i === 0 ? { color: "var(--charcoal)", fontWeight: 600 } : undefined}>
                                  {sec.label}
                                </span>
                                {/* Solo la peor va en naranja: cinco barras naranjas no
                                    señalan nada, gritan. */}
                                <div className={"prog" + (i === 0 && sec.avg < 4 ? " warn" : "")}>
                                  <div className="tk2">
                                    <i style={{ width: `${Math.round((sec.avg / 5) * 100)}%` }} />
                                  </div>
                                  <span className="fr">
                                    {sec.avg}★{mismoN ? "" : ` · n=${sec.n}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <RespuestasExp respuestas={e.respuestas} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* ══════════ ③ TESTIMONIOS ══════════ */}
        <div className="sec-head" style={{ marginTop: 36 }}>
          <span className="eyebrow"><span className="sl">{"//"}</span> Testimonios</span>
          <div className="subtitle" style={{ margin: "4px 0 0" }}>Por aprobar antes de publicarlos.</div>
        </div>
        {testimoniosPendientes.length ? (
          <div className="testi">
            {testimoniosPendientes.map((t) => (
              <div className="tcard glass" key={t.id}>
                <div className="tt">“{t.texto}”</div>
                <div className="tm">
                  <span className="who">
                    {t.iniciales} · {t.experiencia}
                    {!t.consent ? <span style={{ color: "var(--orange)" }}> · sin consentimiento</span> : null}
                  </span>
                  <span className="st">{t.stars != null ? "★".repeat(Math.min(5, Math.round(t.stars))) : ""}</span>
                </div>
                <div className="act-row" style={{ marginTop: 12 }}>
                  <form action={setTestimonioAction} style={{ display: "inline-block" }}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button className="btn btn-orange btn-sm" type="submit" disabled={!t.consent}>Aprobar</button>
                  </form>
                  <form action={setTestimonioAction} style={{ display: "inline-block" }}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button className="btn btn-ghost btn-sm" type="submit">Rechazar</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Nada por moderar. Los testimonios nuevos aparecen aquí.</div>
        )}
      </section>
    </AdminShell>
  );
}
