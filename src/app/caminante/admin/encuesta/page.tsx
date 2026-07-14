import AdminShell from "../ui/AdminShell";
import { fetchEncuestaAdmin, iniciales } from "@/lib/admin/queries";
import type { EncuestaExperiencia } from "@/lib/admin/queries";
import { setTestimonioAction } from "@/lib/admin/encuesta-actions";
import { reenviarEncuesta, reenviarEncuestaPendientes } from "@/lib/feedback/resend-actions";

export const dynamic = "force-dynamic";
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

function ExperienciaCard({ e }: { e: EncuestaExperiencia }) {
  const xid = `en-${e.slug.slice(0, 12)}`;
  const tasa = e.invitadas ? Math.round((e.respondidas / e.invitadas) * 100) : 0;
  const pendientes = e.personas.filter((p) => p.estado === "invitada");
  return (
    <div className="card pad xhead" data-x={xid}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {e.nombre} <span className="chev2">▾</span>
          </div>
          {e.ubicacion ? (
            <div className="mut" style={{ fontSize: 12.5 }}>
              {e.ubicacion}
            </div>
          ) : null}
        </div>
        <div className="badge">
          {e.respondidas ? `${e.respondidas} respuestas` : "Sin respuestas aún"}
        </div>
      </div>

      {e.respondidas ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "14px 0 4px" }}>
            <span className="display" style={{ fontSize: 44 }}>
              {e.avgStars ?? "—"}
            </span>
            <Stars v={e.avgStars} />
          </div>
          <div className="mut" style={{ fontSize: 12.5, marginBottom: 16 }}>
            NPS <b style={{ color: "var(--charcoal)" }}>{e.avgNps ?? "—"}</b> · tasa de respuesta{" "}
            <b style={{ color: "var(--charcoal)" }}>{tasa}%</b> ({e.respondidas}/{e.invitadas})
          </div>
          {e.secciones.map((s) => (
            <div className="barrow" key={s.label}>
              <span>{s.label}</span>
              <div className="bar">
                <i style={{ width: `${Math.min(100, (s.avg / 5) * 100)}%` }} />
              </div>
              <span className="bv">{s.avg}</span>
            </div>
          ))}
        </>
      ) : (
        <div className="empty" style={{ marginTop: 18 }}>
          {e.invitadas
            ? `${e.invitadas} invitaciones enviadas — aún nadie responde.`
            : "La encuesta se enviará sola ~24 h después de cada salida."}
        </div>
      )}

      <div className="xbody" id={xid}>
        <div className="xpad">
          {e.respondidas ? (
            <>
              <div className="xh4">Distribución de estrellas</div>
              {e.distEstrellas.map((d) => (
                <div className="progrow" key={d.etiqueta}>
                  <span>{d.etiqueta}</span>
                  <div className="prog">
                    <div className="tk2">
                      <i style={{ width: e.respondidas ? `${(d.n / e.respondidas) * 100}%` : "0%" }} />
                    </div>
                    <span className="fr">{d.n}</span>
                  </div>
                </div>
              ))}
            </>
          ) : null}

          <div className="xh4">Quién respondió · quién no</div>
          <div className="pchips">
            {e.personas.map((p, i) =>
              p.estado === "respondida" ? (
                <span className="pchip ok" key={i}>
                  <span className="av">{iniciales(p.nombre)}</span>
                  {p.nombre} <span className="stt">✓{p.stars != null ? ` ${p.stars}★` : ""}</span>
                  <span className="dt">{p.fecha}</span>
                </span>
              ) : (
                <span className="pchip pend" key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <a
                    href={`/caminante/feedback/${p.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir su encuesta — copia el link"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "inherit" }}
                  >
                    <span className="av">{iniciales(p.nombre)}</span>
                    {p.nombre} <span className="stt">Pendiente</span>
                    {p.salidaLabel ? <span className="dt">{p.salidaLabel}</span> : null}
                  </a>
                  {p.email ? (
                    <form action={reenviarEncuesta} style={{ display: "inline" }}>
                      <input type="hidden" name="feedbackId" value={p.id} />
                      <button type="submit" className="btn btn-glass btn-sm" title={`Reenviar la encuesta a ${p.email}`} style={{ padding: "3px 9px", fontSize: 11.5 }}>
                        ✉ Reenviar
                      </button>
                    </form>
                  ) : null}
                </span>
              ),
            )}
            {!e.personas.length ? <span className="mut">Sin invitaciones aún.</span> : null}
          </div>
          {pendientes.length ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
              <form action={reenviarEncuestaPendientes}>
                <input type="hidden" name="experienceId" value={e.experienceId} />
                <button type="submit" className="btn btn-orange btn-sm">
                  ✉ Reenviar encuesta a los {pendientes.length} pendientes
                </button>
              </form>
              <span className="mut" style={{ fontSize: 12 }}>
                o toca a un pendiente para copiar su link y mandarlo por WhatsApp.
              </span>
            </div>
          ) : null}

          {e.abiertas.length ? (
            <>
              <div className="xh4">Respuestas abiertas</div>
              <div className="wlist">
                {e.abiertas.map((a, i) => (
                  <div className="wl" key={i}>
                    <span>{a.texto}</span>
                    <span className="m" style={{ color: "var(--orange)" }}>
                      {a.stars != null ? `★ ${a.stars}` : ""}
                    </span>
                    <span className="me">{a.iniciales}</span>
                    <span className="d">{a.fecha}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function EncuestaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const { experiencias, testimoniosPendientes } = await fetchEncuestaAdmin();

  return (
    <AdminShell active="encuesta">
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
              <span className="sl">{"//"}</span> Encuesta
            </span>
            <h1 className="display">
              Cómo se <em className="ac">fueron.</em>
            </h1>
            <div className="desc">
              Toca una experiencia para ver quién respondió, quién falta y qué dijeron.
            </div>
          </div>
        </div>

        <div className="grid2">
          {experiencias.map((e) => (
            <ExperienciaCard key={e.slug} e={e} />
          ))}
          {experiencias.length === 0 ? (
            <div className="empty">Aún no se han enviado encuestas.</div>
          ) : null}
        </div>

        <div style={{ marginTop: 24 }}>
          <span className="subtitle">Testimonios por aprobar</span>
          {testimoniosPendientes.length ? (
            <div className="testi">
              {testimoniosPendientes.map((t) => (
                <div className="tcard glass" key={t.id}>
                  <div className="tt">“{t.texto}”</div>
                  <div className="tm">
                    <span className="who">
                      {t.iniciales} · {t.experiencia}
                      {!t.consent ? (
                        <span style={{ color: "var(--orange)" }}> · sin consentimiento</span>
                      ) : null}
                    </span>
                    <span className="st">
                      {t.stars != null ? "★".repeat(Math.min(5, Math.round(t.stars))) : ""}
                    </span>
                  </div>
                  <div className="act-row" style={{ marginTop: 12 }}>
                    <form action={setTestimonioAction} style={{ display: "inline-block" }}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button className="btn btn-orange btn-sm" type="submit" disabled={!t.consent}>
                        Aprobar
                      </button>
                    </form>
                    <form action={setTestimonioAction} style={{ display: "inline-block" }}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <button className="btn btn-ghost btn-sm" type="submit">
                        Rechazar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ marginTop: 12 }}>
              Nada por moderar. Los testimonios nuevos aparecen aquí.
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
