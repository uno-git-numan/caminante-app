"use client";

// Panorama — transcrito de ScrPanorama (design/admin-movil/adm-screens-a.jsx).
// El markup y las clases van tal cual; los números salen de fetchAdminOverview.
//
// Lo que el prototipo traía escrito a mano y aquí es real: los porcentajes de
// las barras se calculan contra el máximo de la lista (en el mockup eran fijos),
// y el «hoy» solo aparece si de verdad hay una salida hoy.

import type { Nav, Ui } from "./AppShell";
import { Chev, Gap, Head, Prow, Sub, fmt } from "./kit";

export type PanoramaData = {
  ingresosMes: number;
  historicoIng: number;
  mesLabel: string;
  variacion: { pct: number; contra: string } | null;
  porExperiencia: { nombre: string; monto: number }[];
  personasPorOperar: number;
  reservasPorEstado: Record<string, number>;
  porSalida: { label: string; taken: number; capacity: number | null; flojo: boolean }[];
  deslindes: { firmados: number; esperados: number; faltan: { salida: string; faltan: number }[] };
  satisfaccion: { prom: number | null; respuestas: number; dist: { etiqueta: string; n: number }[] };
  hoy: { nombre: string; ubicacion: string | null; personas: number; sinFirmar: number; slug: string; slotId: string } | null;
  pendienteCobro: { monto: number; reservas: number };
};

const pct = (n: number, max: number) => (max > 0 ? Math.round((n / max) * 100) : 0);

export default function Panorama({ d, nav, ui }: { d: PanoramaData; nav: Nav; ui: Ui }) {
  const maxExp = Math.max(1, ...d.porExperiencia.map((x) => x.monto));
  const maxDist = Math.max(1, ...d.satisfaccion.dist.map((x) => x.n));
  const pagadas = d.reservasPorEstado.paid || 0;
  const confirmadas = d.reservasPorEstado.confirmed || 0;
  const deslFalt = d.deslindes.esperados - d.deslindes.firmados;

  return (
    <div className="adm-screen">
      <Head eyebrow="Panorama" title="Tu operación, <em>en vivo.</em>" />
      <div className="adm-pad">
        {d.hoy && (
          <div className="adm-note adm-note-forest">
            <span className="st" style={{ background: "var(--orange)" }}></span>
            <span style={{ flex: 1 }}>
              <b>
                Hoy · {d.hoy.nombre}
                {d.hoy.ubicacion ? ` · ${d.hoy.ubicacion}` : ""}
              </b>
              <br />
              {d.hoy.personas} personas ·{" "}
              {d.hoy.sinFirmar === 0 ? "todos firmaron" : `${d.hoy.sinFirmar} deslindes sin firmar`}
            </span>
            <button
              className="adm-btn"
              style={{ color: "#fff", border: "1px solid rgba(255,255,255,.35)" }}
              onClick={() => {
                nav.setTab("eventos");
                nav.push("evento", { slug: d.hoy!.slug });
                nav.push("roster", { slotId: d.hoy!.slotId });
              }}
            >
              Abrir
            </button>
          </div>
        )}
        {d.hoy && <Gap />}

        <div className="adm-card adm-pulse">
          <details open>
            <summary>
              <span className="lbl">
                <b>Ingresos del mes</b>histórico {fmt(d.historicoIng)}
              </span>
              <span className="val">
                {fmt(d.ingresosMes)}
                {d.variacion && (
                  <span className="up">
                    {d.variacion.pct >= 0 ? "+" : "−"}
                    {Math.abs(d.variacion.pct)}% vs. {d.variacion.contra}
                  </span>
                )}
              </span>
              <Chev />
            </summary>
            <div className="adm-x">
              <Sub>Por experiencia</Sub>
              {d.porExperiencia.length ? (
                d.porExperiencia.map((x) => (
                  <Prow key={x.nombre} l={x.nombre} w={pct(x.monto, maxExp)} fr={fmt(x.monto)} />
                ))
              ) : (
                <Prow l="Sin ingresos este mes" w={0} fr="—" />
              )}
              <div className="adm-acts">
                <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => nav.setTab("dinero")}>
                  Ver Dinero
                </button>
              </div>
            </div>
          </details>

          <details>
            <summary>
              <span className="lbl">
                <b>Por operar</b>
                {pagadas} pagadas · {confirmadas} confirmada{confirmadas === 1 ? "" : "s"}
              </span>
              <span className="val">
                {d.personasPorOperar}
                <span className="u"> próx.</span>
              </span>
              <Chev />
            </summary>
            <div className="adm-x">
              <Sub>Por salida</Sub>
              {d.porSalida.length ? (
                d.porSalida.map((s, i) => (
                  <Prow
                    key={i}
                    l={s.label}
                    w={s.capacity ? pct(s.taken, s.capacity) : null}
                    fr={s.capacity ? `${s.taken}/${s.capacity}` : String(s.taken)}
                    warn={s.flojo}
                  />
                ))
              ) : (
                <Prow l="Sin salidas próximas" w={0} fr="—" />
              )}
              <div className="adm-acts">
                <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => nav.setTab("eventos")}>
                  Ver Eventos
                </button>
              </div>
            </div>
          </details>

          <details>
            <summary>
              <span className="lbl">
                <b>Deslindes firmados</b>salidas próximas
              </span>
              <span className="val">
                {d.deslindes.firmados}
                <span className="u"> /{d.deslindes.esperados}</span>
                {deslFalt > 0 && <span className="up wr">{deslFalt} pendientes</span>}
              </span>
              <Chev />
            </summary>
            <div className="adm-x">
              <Sub>Dónde faltan</Sub>
              {d.deslindes.faltan.length ? (
                d.deslindes.faltan.slice(0, 3).map((f, i) => (
                  <Prow key={i} l={f.salida} w={null} fr={`faltan ${f.faltan}`} warn />
                ))
              ) : (
                <Prow l="Nadie pendiente" w={null} fr="—" />
              )}
              <div className="adm-acts">
                <button
                  className="adm-btn adm-btn-orange adm-btn-sm"
                  onClick={() => {
                    nav.setTab("gente");
                    nav.push("encuesta");
                  }}
                >
                  Recordar firmas
                </button>
              </div>
            </div>
          </details>

          <details>
            <summary>
              <span className="lbl">
                <b>Satisfacción</b>
                {d.satisfaccion.respuestas} respuesta{d.satisfaccion.respuestas === 1 ? "" : "s"}
              </span>
              <span className="val">
                {d.satisfaccion.prom ?? "—"}
                <span className="u"> /5</span>
              </span>
              <Chev />
            </summary>
            <div className="adm-x">
              <Sub>Distribución</Sub>
              {d.satisfaccion.dist.map((x, i) => (
                <Prow key={i} l={x.etiqueta} w={pct(x.n, maxDist)} fr={String(x.n)} warn={i >= 2 && x.n > 0} />
              ))}
              <div className="adm-acts">
                <button
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  onClick={() => {
                    nav.setTab("gente");
                    nav.push("encuesta");
                  }}
                >
                  Ver Encuesta
                </button>
              </div>
            </div>
          </details>
        </div>

        <Gap />
        {d.pendienteCobro.monto > 0 && (
          <div className="adm-note adm-note-warn">
            <span className="st" style={{ background: "var(--orange)" }}></span>
            <span style={{ flex: 1 }}>
              <b>{fmt(d.pendienteCobro.monto)} pendiente de cobro.</b> {d.pendienteCobro.reservas} reserva
              {d.pendienteCobro.reservas === 1 ? "" : "s"} deben saldo.
            </span>
            <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => nav.setTab("gente")}>
              Ver
            </button>
          </div>
        )}
        <Gap s />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="adm-btn adm-btn-orange"
            style={{ flex: 1 }}
            onClick={() => {
              nav.setTab("mas");
              nav.push("cobro");
            }}
          >
            Generar cobro
          </button>
          <button
            className="adm-btn adm-btn-ghost"
            style={{ flex: 1 }}
            onClick={() =>
              ui.toastify("Nueva experiencia", "la autoría completa vive en el panel de computadora")
            }
          >
            + Experiencia
          </button>
        </div>
      </div>
    </div>
  );
}
