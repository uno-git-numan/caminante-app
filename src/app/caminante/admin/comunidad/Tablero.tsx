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
import Cajon from "../ui/Cajon";
import PanelTarjeta from "./PanelTarjeta";
import { AsgAv, AsgCtl } from "../ui/asignar/Asignar";
import { claveTit, type PersonaParaAsignar, type Titularidad, type Yo } from "@/lib/equipo/atribucion-reglas";

const mxn = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;
const diaMes = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", weekday: "short", day: "numeric", month: "short" }).format(new Date(iso)).replace(/\./g, "");

/** Los chips de la tarjeta, por etapa (lámina: «Grupo puesto», «Deslinde firmado», ★ · NPS). */
function Chips({ t }: { t: Tarjeta }) {
  const lug = t.pago?.lugares ?? t.personas;
  return (
    <div className="met">
      <span className="cmtag"><b className="k">{lug}</b> {t.stage === "llego" || t.stage === "conversacion" ? (lug === 1 ? "persona" : "personas") : lug === 1 ? "lugar" : "lugares"}</span>
      {t.stage === "llego" || t.stage === "conversacion" ? <span className="cmtag">{t.origen}</span> : null}
      {t.stage === "interesado" ? <span className="cmtag">{t.grupoUrl ? "Grupo puesto" : "Sin grupo"}</span> : null}
      {t.stage === "pagado" ? <span className="chip c-paid"><span className="cd" />Pagado</span> : null}
      {t.stage === "preparando" && t.deslindeFirmado ? <span className="cmtag">Deslinde firmado</span> : null}
      {t.stage === "preparando" && t.grupoUrl ? <span className="cmtag">En el grupo</span> : null}
      {t.stage === "viajo" && t.encuesta.estado === "contesto" ? (
        <span className="cmtag">★ <span className="k">{t.encuesta.stars ?? "—"}</span>{t.encuesta.nps != null ? <> · NPS <span className="k">{t.encuesta.nps}</span></> : null}</span>
      ) : null}
      {t.stage === "caido" ? <span className="chip c-canc"><span className="cd" />Se cayó</span> : null}
    </div>
  );
}

/** La línea «qué sigue» de la tarjeta, por etapa. */
function QueSigue({ t }: { t: Tarjeta }) {
  if (t.motivoCaida) return <p className="cmnext"><s>·</s><i>{t.motivoCaida}</i></p>;
  if (t.fria) return <p className="cmnext"><s>⚠</s><span>Sin contactar desde hace <b>{t.diasQuieta} días</b></span></p>;
  switch (t.stage) {
    case "llego":
    case "conversacion":
      if (t.llamada) return <p className="cmnext"><s>{t.llamada.pasada ? "✓" : "→"}</s><span>{t.llamada.pasada ? "Habló el" : "Llamada el"} <b>{diaMes(t.llamada.startsAt)}</b></span></p>;
      return t.diasQuieta > 0 ? <p className="cmnext"><s>→</s><span>Sin contactar desde hace <b>{t.diasQuieta} {t.diasQuieta === 1 ? "día" : "días"}</b></span></p> : null;
    case "interesado":
      return <p className="cmnext"><s>→</s><span>Falta pagar <b>{t.pago ? mxn(t.pago.falta) : "· sin reserva"}</b></span></p>;
    case "pagado": {
      if (!t.salidaInfo?.inicio) return null;
      const arranca = new Date(new Date(t.salidaInfo.inicio).getTime() - 14 * 86400000).toISOString();
      return <p className="cmnext"><s>✓</s><span>Los mensajes de preparación arrancan el <b>{diaMes(arranca)}</b></span></p>;
    }
    case "preparando":
      return t.salidaInfo?.inicio ? <p className="cmnext"><s>→</s><span>Sale el <b>{diaMes(t.salidaInfo.inicio)}</b></span></p> : null;
    case "viajo":
      if (t.encuesta.estado === "contesto") return <p className="cmnext"><s>✓</s><span>Contestó la encuesta{t.encuesta.publicable ? <> · <b>testimonio publicable</b></> : null}</span></p>;
      return <p className="cmnext"><s>→</s><span>No ha contestado la encuesta</span></p>;
    default:
      return null;
  }
}

function Tarj({ t, arrastrable, onDrag, tit, picked, onPick }: { t: Tarjeta; arrastrable: boolean; onDrag: (id: string) => void; tit: Titularidad; picked: boolean; onPick: () => void }) {
  return (
    <article
      className={`cmc${t.fria ? " cold" : ""}${t.stage === "caido" ? " lost" : ""}${picked ? " picked" : ""}`}
      draggable={arrastrable}
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(); } }}
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
        {/* `.nm`, como en la lámina: el nombre arriba y la salida abajo. Con
            `.g` (que aquí no existe) se pegaban en un solo renglón. */}
        <span className="nm">
          <b>{t.persona}</b>
          <small>
            {t.experiencia}
            {t.salida ? <> · <span className="sal">{t.salida}</span></> : ""}
          </small>
        </span>
        {/* La edad sólo cuando la tarjeta está fría, como en la lámina («9 días»);
            una tarjeta al día no carga reloj. */}
        {t.fria ? <span className="age">{t.diasQuieta} días</span> : null}
        {/* Quien la lleva (0071), en la esquina: sin titular no hay hueco. */}
        <AsgAv tit={tit} />
      </div>
      <Chips t={t} />
      <QueSigue t={t} />
    </article>
  );
}

export default function TableroCRM({ d, tits, equipo, yo, operadora, remitente }: { d: Datos; tits: Record<string, Titularidad>; equipo: PersonaParaAsignar[]; yo: Yo; operadora: string; remitente: string | null }) {
  const [tomada, setTomada] = useState<string | null>(null);
  // PICAR UNA TARJETA ABRE SU FICHA (lámina «Quién lo lleva»): quién es, qué
  // sigue, escribirle, y quién la lleva. El resto del tablero no cambia.
  const [abierta, setAbierta] = useState<string | null>(null);
  const sel = [...d.tarjetas, ...d.caidas].find((t) => t.id === abierta) ?? null;
  const etapaDe = (t: Tarjeta) => ETAPAS.find((e) => e.id === t.stage);
  const [error, setError] = useState("");
  const [nota, setNota] = useState("");
  const [pendiente, empezar] = useTransition();
  // Soltar en «Se cayeron» abre la ficha pidiendo el motivo: perder es un dato.
  const [caidaPara, setCaidaPara] = useState<string | null>(null);
  // La séptima columna vive colapsada: no compite con el trabajo vivo, pero está.
  const [caidasAbiertas, setCaidasAbiertas] = useState(false);

  const soltar = (destino: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || tomada;
    setTomada(null);
    if (!id) return;
    empezar(async () => {
      const r = await moverTarjeta(id, destino);
      setError(r.ok ? "" : r.error);
      setNota(r.ok && r.salidaAbierta ? `Se abrió su fecha de grupo: ${r.salidaAbierta.label}. La liga está en su ficha.` : "");
    });
  };

  return (
    <>
      {error ? (
        <div className="cmerr" role="alert">{error}</div>
      ) : null}
      {nota ? (
        <p className="cmnext" role="status" style={{ marginBottom: 10 }}><s>✓</s><span>{nota}</span></p>
      ) : null}

      <Cajon
        abierta={!!sel}
        cerrar={() => { setAbierta(null); setCaidaPara(null); }}
        ficha={
          sel && {
            iniciales: sel.iniciales,
            titulo: sel.persona,
            subtitulo: <>{sel.experiencia}{sel.salida ? ` · ${sel.salida}` : ""} · {sel.personas} {sel.personas === 1 ? "persona" : "personas"}</>,
            banda: sel.stage === "caido" ? "Se cayeron" : (etapaDe(sel)?.titulo ?? "Tarjeta"),
            numero: sel.stage === "caido" ? "07" : etapaDe(sel)?.n,
            // Como en la lámina: la banda dice CÓMO se sale de la etapa, no cuánto lleva.
            bandaDer: sel.stage === "caido" ? "Fuera del camino" : etapaDe(sel)?.como,
            cuerpo: (
              <>
                <PanelTarjeta
                  key={sel.id}
                  t={sel}
                  agenda={d.agenda}
                  operadora={operadora}
                  remitente={remitente}
                  caidaPedida={caidaPara === sel.id}
                  onCaidaHecha={() => setCaidaPara(null)}
                />
                <AsgCtl key={`asg-${sel.id}`} objeto="tarjeta" objetoId={sel.id} operatorId={sel.operatorId} tit={tits[claveTit("tarjeta", sel.id)] ?? null} equipo={equipo} yo={yo} noun={`tarjetas de ${operadora}`} />
              </>
            ),
          }
        }
      >
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
                    <Tarj key={t.id} t={t} arrastrable={recibe && !pendiente} onDrag={setTomada} tit={tits[claveTit("tarjeta", t.id)] ?? null} picked={t.id === abierta} onPick={() => setAbierta(t.id)} />
                  ))}
                  {dentro.length === 0 ? <div className="cmghost">esperando</div> : null}
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

          {/* Perder es un dato. No compite con el trabajo vivo, pero está:
              colapsada en 60 px, se abre al picarla. Soltar aquí abre la ficha
              pidiendo el motivo. */}
          <section
            className={`cmcol lost${caidasAbiertas ? " open" : ""}`}
            style={caidasAbiertas ? undefined : { cursor: "pointer" }}
            onClick={() => !caidasAbiertas && setCaidasAbiertas(true)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || tomada;
              setTomada(null);
              if (!id) return;
              setCaidaPara(id);
              setAbierta(id);
            }}
          >
            {caidasAbiertas ? (
              <>
                <header className="cmcol-hd">
                  <span className="no">07</span>
                  <h3>Se cayeron</h3>
                  <span className="ct">{d.caidas.length}</span>
                  <span className="how">Fuera del camino</span>
                </header>
                <p className="src">No es un fracaso permanente: es un «ahora no». Se guarda con su motivo y se puede reabrir.</p>
                <div className="cmcards">
                  {d.caidas.map((t) => (
                    <Tarj key={t.id} t={t} arrastrable={false} onDrag={() => {}} tit={tits[claveTit("tarjeta", t.id)] ?? null} picked={t.id === abierta} onPick={() => setAbierta(t.id)} />
                  ))}
                  {d.caidas.length === 0 ? <div className="cmghost">nadie</div> : null}
                </div>
              </>
            ) : (
              <>
                <span className="cv">▸</span>
                <span className="n">{d.caidas.length}</span>
                <span className="vt">Se cayeron</span>
              </>
            )}
          </section>
        </div>
      </div>
      </Cajon>

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
