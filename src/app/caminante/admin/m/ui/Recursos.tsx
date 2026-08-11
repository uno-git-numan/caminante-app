"use client";

// RECURSOS en el teléfono — transcrita de `ScrDineroV2` del entregable
// (design/admin-movil/adm-dinero.jsx), con datos reales.
//
// La pestaña se llamaba «Dinero»; ahora es «Recursos», igual que en el panel de
// escritorio (Luis, 11 ago). Es la misma pregunta —qué entra y qué sale— y dos
// nombres para lo mismo confunden.
//
// Estructura del entregable, respetada: `Head` con acción, una tarjeta
// `adm-pulse` con el número del mes que se despliega a su comparación, el aviso
// de lo que urge, y la lista por experiencia en `adm-li` con su desglose.
//
// ⚠️ Lo que el mockup traía y aquí NO va: la comparación «+18% vs. jul» y los
// totales de ejemplo estaban escritos a mano en el .jsx. Aquí solo se pinta lo
// que hay en la base; donde no hay dato, no hay línea.

import type { RecursosMovil } from "@/lib/admin/movil-datos";
import { Chev, Gap, Head, ProwN, Sub, fmt } from "./kit";

export default function Recursos({ d }: { d: RecursosMovil }) {
  return (
    <div className="adm-screen">
      <Head
        eyebrow="Recursos"
        title="¿Cómo <em>vamos?</em>"
        action={
          <a className="adm-btn adm-btn-ghost adm-btn-sm" href="/caminante/admin/recursos">
            Ver completo
          </a>
        }
      />
      <div className="adm-pad">
        <div className="adm-card adm-pulse">
          <details>
            <summary>
              <span className="lbl">
                <b>Cobrado en {d.mesLabel}</b>
                bruto · la comisión de Stripe se resta en la escalera
              </span>
              <span className="val">{fmt(d.ingresosMes)}</span>
              <Chev />
            </summary>
            <div className="adm-x">
              <Sub>De dónde sale</Sub>
              <ProwN l={`Cobrado en ${d.mesLabel}`} fr={fmt(d.ingresosMes)} b />
              <ProwN l="Histórico" fr={fmt(d.historico)} />
            </div>
          </details>
        </div>

        <Gap s />

        {/* Lo que urge primero: una salida abajo de su equilibrio todavía se
            puede llenar. Una que ya se fue, no. */}
        {d.enRiesgo ? (
          <div className="adm-note adm-note-warn">
            <span className="st" style={{ background: "var(--orange)" }}></span>
            <span style={{ flex: 1 }}>
              <b>
                {d.enRiesgo.nombre} · {d.enRiesgo.salida}
              </b>{" "}
              va abajo del equilibrio: faltan {d.enRiesgo.faltan}{" "}
              {d.enRiesgo.faltan === 1 ? "cliente" : "clientes"} para dejar de perder.
            </span>
          </div>
        ) : (
          <div className="adm-note adm-note-info">
            <span className="st" style={{ background: "var(--olive)" }}></span>
            <span>Ninguna salida abierta va abajo de su equilibrio.</span>
          </div>
        )}

        {d.pendiente > 0 ? (
          <>
            <Gap s />
            <div className="adm-note adm-note-warn">
              <span className="st" style={{ background: "var(--orange)" }}></span>
              <span style={{ flex: 1 }}>
                <b>Te deben {fmt(d.pendiente)}.</b> {d.pendienteN}{" "}
                {d.pendienteN === 1 ? "reserva" : "reservas"} con saldo abierto.
              </span>
            </div>
          </>
        ) : null}

        <Gap />

        <Sub pad>Por experiencia</Sub>
        <div className="adm-card">
          {d.experiencias.map((e) => (
            <details className="adm-li" key={e.nombre}>
              <summary>
                <div className="r1">
                  <span className="t">
                    {e.nombre}
                    <small>
                      {e.salidas.length} {e.salidas.length === 1 ? "salida" : "salidas"}
                    </small>
                  </span>
                  <span className="m adm-mono">{fmt(e.ingreso)}</span>
                </div>
                <div className="r2">
                  <span>
                    egresos {fmt(e.egreso)} ·{" "}
                    {/* Sin costos no se inventa una utilidad: se dice. */}
                    {e.utilidad != null ? `utilidad ${fmt(e.utilidad)}` : "sin costear"}
                  </span>
                </div>
              </summary>
              <div className="adm-x">
                <Sub>Por salida</Sub>
                {e.salidas.map((s) => (
                  <ProwN
                    key={s.slotId}
                    l={`${s.label} · ${s.vendidos}${s.cupo ? "/" + s.cupo : ""} pers. · ${s.pagos} ${
                      s.pagos === 1 ? "pago" : "pagos"
                    }`}
                    fr={fmt(s.ingreso)}
                  />
                ))}
              </div>
            </details>
          ))}
          {!d.experiencias.length ? (
            <div className="adm-x">
              <Sub>Todavía no hay dinero registrado.</Sub>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
