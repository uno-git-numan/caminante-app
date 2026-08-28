"use client";

// EL TABLERO — transcrito de design/comunidad/dc/comunidad.dc.html (familia .cm*).
//
// Kanban clásico: columnas por etapa, tarjetas dentro, se arrastra para mover.
//
// ⚠️ EL SCROLL HORIZONTAL VIVE EN .cmboard Y EN NINGÚN OTRO LADO. La página no
// se desliza de lado nunca: la navegación y el segmentado se quedan siempre a
// la vista. Si el scroll viviera en la página, abrir cualquier cosa dejaría el
// tablero inservible detrás.

import { useState, useTransition } from "react";
import { ETAPAS, A_MANO } from "@/lib/comunidad/etapas";
import type { Tablero as Datos, Tarjeta } from "@/lib/comunidad/tablero";
import { moverTarjeta } from "@/lib/comunidad/tablero-actions";

function Tarj({ t, arrastrable, onDrag }: { t: Tarjeta; arrastrable: boolean; onDrag: (id: string) => void }) {
  return (
    <article
      className={`cmc${t.fria ? " cold" : ""}${t.stage === "caido" ? " lost" : ""}`}
      draggable={arrastrable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", t.id);
        onDrag(t.id);
      }}
    >
      <div className="hd">
        {/* El asa existe SÓLO donde se puede arrastrar. Su ausencia es la señal
            principal: no hay nada que tomar. */}
        {arrastrable ? <span className="cmgrip" aria-hidden>≡</span> : null}
        <span className="av">{t.iniciales}</span>
        <span className="g">
          <b>{t.persona}</b>
          <small>
            {t.experiencia}
            {t.salida ? ` · ${t.salida}` : ""}
          </small>
        </span>
        <span className={`ag${t.fria ? " mal" : ""}`}>
          {t.diasQuieta === 0 ? "hoy" : `hace ${t.diasQuieta} d`}
        </span>
      </div>
      <div className="cmtag">
        <span>
          <b>{t.personas}</b> {t.personas === 1 ? "persona" : "personas"}
        </span>
        <span>{t.origen}</span>
      </div>
      {t.motivoCaida ? (
        <p className="cmnext"><s>·</s><i>{t.motivoCaida}</i></p>
      ) : t.fria ? (
        <p className="cmnext"><s>⚠</s><span>Sin contactar desde hace <b>{t.diasQuieta} días</b></span></p>
      ) : null}
    </article>
  );
}

export default function TableroCRM({ d }: { d: Datos }) {
  const [tomada, setTomada] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  const soltar = (destino: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || tomada;
    setTomada(null);
    if (!id) return;
    empezar(async () => {
      const r = await moverTarjeta(id, destino);
      setError(r.ok ? "" : r.error);
    });
  };

  return (
    <>
      {error ? (
        <div className="cmerr" role="alert">{error}</div>
      ) : null}

      <div className="cmboard">
        <div className="cmtrack">
          {ETAPAS.map((et) => {
            const dentro = d.tarjetas.filter((t) => t.stage === et.id);
            const recibe = A_MANO.has(et.id);
            return (
              <section
                key={et.id}
                className={`cmcol${recibe ? "" : " recv"}${tomada ? (recibe ? " can" : " cant") : ""}`}
                onDragOver={(e) => recibe && e.preventDefault()}
                onDrop={recibe ? soltar(et.id) : undefined}
              >
                <header className="cmcol-hd">
                  <span className="no">{et.n}</span>
                  <h3>{et.titulo}</h3>
                  <span className="ct">{dentro.length}</span>
                  <span className="how">{et.como}</span>
                </header>
                <p className="src">{et.pie}</p>
                <div className="cmcards">
                  {dentro.map((t) => (
                    <Tarj key={t.id} t={t} arrastrable={recibe && !pendiente} onDrag={setTomada} />
                  ))}
                  {dentro.length === 0 ? <div className="cmghost" /> : null}
                </div>
                {/* Sin regaño y sin una gota de rojo: dice quién decide, no que
                    hiciste algo mal. */}
                {tomada && !recibe ? (
                  <p className="nodrop">
                    Aquí no se suelta nada.{" "}
                    {et.id === "pagado" ? "Entra cuando Stripe confirma el pago." : "Entra sola."}
                  </p>
                ) : null}
              </section>
            );
          })}

          {/* Perder es un dato. No compite con el trabajo vivo, pero está. */}
          <section
            className="cmcol lost"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setTomada(null);
              setError("Para dar por caída una tarjeta hace falta su motivo — se pide al abrirla.");
            }}
          >
            <header className="cmcol-hd">
              <span className="no">—</span>
              <h3>Se cayeron</h3>
              <span className="ct">{d.caidas.length}</span>
              <span className="how">Con su motivo</span>
            </header>
            <p className="src">No es un fracaso permanente: es un «ahora no».</p>
            <div className="cmcards">
              {d.caidas.map((t) => (
                <Tarj key={t.id} t={t} arrastrable={false} onDrag={() => {}} />
              ))}
              {d.caidas.length === 0 ? <div className="cmghost" /> : null}
            </div>
          </section>
        </div>
      </div>

      {d.total === 0 ? (
        <div className="empty" style={{ marginTop: 18 }}>
          <b style={{ display: "block", fontSize: 17, fontWeight: 400, color: "var(--charcoal)", marginBottom: 8 }}>
            Todavía no hay nadie preguntando.
          </b>
          <p style={{ maxWidth: "52ch", margin: "0 auto", lineHeight: 1.6 }}>
            Las tarjetas van a caer solas en «Llegó» cuando alguien pida una fecha desde tu
            experiencia, te escriba por WhatsApp, o llegue por un embajador. No es un pendiente:
            es el primer día.
          </p>
        </div>
      ) : null}
    </>
  );
}
