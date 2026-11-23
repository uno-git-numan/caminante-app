"use client";

// EL BLOQUE «SU ESPACIO» — transcrito de design/comunidad/dc/espacio/3-D-panel.jsx
// (SuEspacio). Vive en dos lugares, con el mismo marcado: el panel lateral de la
// tarjeta de la anfitriona (D2) y la cápsula de la salida privada (D3, con la
// puerta «Abrir el espacio como lo ve el grupo»). Se arma sólo con clases que
// ya existen en admin-css.ts: .xh4 .salfoot .sallk .dl .mini-form .salper .mut .st.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarLimitesDeGrupo, mandarLigaALaAnfitriona } from "@/lib/grupo/acciones";
import type { ResumenDelEspacio } from "@/lib/grupo/resumen";

const diaLargo = (ymd: string) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...o }).format(d);
  return `${f({ day: "numeric" })} de ${f({ month: "long" })}`;
};
const diaCorto = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "short" }).format(new Date(iso)).replace(/\./g, "");

export default function SuEspacio({ g, abrir = false }: { g: ResumenDelEspacio; abrir?: boolean }) {
  const [ok, setOk] = useState(false);
  const [fecha, setFecha] = useState(g.fechaLimite ?? "");
  const [minimo, setMinimo] = useState(g.minimo != null ? String(g.minimo) : "");
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, start] = useTransition();
  // Vencida = la fecha GUARDADA ya pasó (día de la Ciudad de México).
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  const vencida = !!g.fechaLimite && g.fechaLimite.slice(0, 10) < hoy;
  const router = useRouter();
  const copiar = () => navigator.clipboard?.writeText(g.liga).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); });
  const [avisoLiga, setAvisoLiga] = useState<string | null>(null);
  const mandarLiga = () =>
    start(async () => {
      const r = await mandarLigaALaAnfitriona(g.slotId);
      setAvisoLiga(r.ok ? r.aviso : r.error);
      if (r.ok && r.waUrl) window.open(r.waUrl, "_blank", "noopener");
      if (r.ok) router.refresh();
    });
  const guardar = () =>
    start(async () => {
      const r = await guardarLimitesDeGrupo(g.slotId, fecha, minimo);
      setAviso(r.ok ? "Guardado." : r.error);
      if (r.ok) router.refresh();
    });

  return (
    <>
      <p className="xh4">Su espacio</p>
      <div className="salfoot" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
        <div className="sallk">
          <span>{g.liga.replace(/^https?:\/\//, "")}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={copiar}>{ok ? "Copiada" : "Copiar"}</button>
        </div>
        {abrir ? (
          <a className="btn btn-ghost btn-sm" href={g.liga} target="_blank" rel="noopener">
            Abrir el espacio como lo ve el grupo
          </a>
        ) : null}
        <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={mandarLiga}>
          {g.gente.some((p) => p.anfitrion) ? "Volver a mandarle su liga" : "Mandarle su liga al anfitrión"}
        </button>
      </div>
      {avisoLiga ? <p className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>{avisoLiga}</p> : null}
      <dl className="dl" style={{ marginTop: 12 }}>
        <dt>Anfitrión</dt>
        <dd>{g.anfitrion ?? "—"}</dd>
        <dt>Pidió la fecha</dt>
        <dd>{g.pidioEl ? diaLargo(g.pidioEl) : "—"}</dd>
        <dt>Lugares</dt>
        <dd>{g.cupo != null ? `${g.apartados} de ${g.cupo} apartados` : `${g.apartados} apartados`}</dd>
      </dl>
      {/* LA FECHA LÍMITE PARA PAGAR, CON SU NOMBRE (Luis, 23 nov 2026: «debería
          de ser sencillo de hacer en el UI»). Eran dos campos sin rótulo y una
          leyenda gris al lado; el grupo del Izta llevaba nueve días con la
          fecha vencida y nadie podía pagar sin que esta pantalla lo dijera. */}
      <p className="xh4">Hasta cuándo pueden pagar</p>
      {vencida ? (
        <p className="mut" style={{ fontSize: 12.5, color: "#b33517", marginTop: 0 }}>
          La fecha límite ya pasó ({diaLargo(g.fechaLimite!)}): hoy nadie del grupo puede apartar ni pagar. Muévela aquí abajo.
        </p>
      ) : null}
      <div className="mini-form" style={{ marginTop: 0 }}>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Fecha límite para pagar{" "}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha límite" />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Mínimo de lugares{" "}
          <input type="number" value={minimo} onChange={(e) => setMinimo(e.target.value)} min={1} max={g.cupo ?? undefined} aria-label="Mínimo" style={{ width: 76 }} />
        </label>
        <button type="button" className="btn btn-orange btn-sm" disabled={pendiente} onClick={guardar}>
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
        {aviso ? <span className="mut" style={{ fontSize: 12 }}>{aviso}</span> : null}
      </div>
      <p className="mut" style={{ fontSize: 12, marginTop: 6 }}>
        Pasada esa fecha ya nadie del grupo puede apartar ni pagar. Se puede mover hasta el día de la salida.
      </p>
      <p className="xh4">Quién entró · {g.gente.length}</p>
      {g.gente.length === 0 ? (
        <p className="mut" style={{ fontSize: 12.5 }}>Nadie ha entrado todavía. Cuando alguien entre por la liga, aparece aquí.</p>
      ) : (
        g.gente.map((p) => (
          <div key={p.lugarId} className="salper">
            <span className="av">{p.iniciales}</span>
            <span className="nm">
              {p.nombre}
              <small>{p.anfitrion ? "Anfitrión" : p.pagadoPor ? `Pagado por ${p.pagadoPor}` : `Entró el ${diaCorto(p.entroEl)}`}</small>
            </span>
            <span className="rt">
              {p.estado === "firmo" ? (
                <span className="mut" style={{ fontSize: 12 }}>{p.lugaresPagados > 1 ? `Pagó ${p.lugaresPagados} · firmó` : "Pagó · firmó"}</span>
              ) : p.estado === "pago" ? (
                <span className="st">Falta firmar</span>
              ) : p.listaEspera ? (
                <span className="mut" style={{ fontSize: 12 }}>Lista de espera</span>
              ) : (
                <span className="st">Falta pagar</span>
              )}
            </span>
          </div>
        ))
      )}
    </>
  );
}
