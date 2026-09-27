"use client";

// QUIÉN LO LLEVA — transcrito de la lámina «Quién lo lleva» (design/equipo/dc/
// QuienLoLleva.html: `LoLleva`, `AsgCtl`, `asgVerbo`). Se usa en las dos
// Comunidad: la tarjeta de operadora del pipeline y su cajón, la tarjeta del
// CRM y su cajón.
//
// Las reglas no viven aquí: `verboDeAsignacion` y `puedeTener` son puras
// (lib/equipo/atribucion-reglas.ts) y el servidor vuelve a decidir todo en
// `tomar` / `asignar` / `transferir` (lib/equipo/atribucion-actions.ts).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { asignar, tomar, transferir } from "@/lib/equipo/atribucion-actions";
import { puedeTener, verboDeAsignacion, type Objeto } from "@/lib/equipo/atribucion-reglas";
import type { PersonaParaAsignar, Titularidad, Yo } from "@/lib/equipo/atribucion-reglas";

const MESC = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fcorta = (iso: string) => {
  const d = new Date(new Date(iso).getTime() - 6 * 3600_000);
  return `${d.getUTCDate()} ${MESC[d.getUTCMonth()]}`;
};
const esHoy = (iso: string) => {
  const a = new Date(new Date(iso).getTime() - 6 * 3600_000), b = new Date(Date.now() - 6 * 3600_000);
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
};
const ini = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const asgDesde = (d: string) => (esHoy(d) ? "desde hoy" : "desde el " + fcorta(d));

/** La línea «Lo lleva». Con `label` lleva el rótulo (en el cajón); sin él es el pie de la tarjeta. */
export function LoLleva({ tit, label }: { tit: Titularidad; label?: boolean }) {
  const k = label ? <span className="asgk">Lo lleva</span> : null;
  if (tit && "staffId" in tit) {
    return <span className="asgline">{k}<span className="pchip"><span className="av">{ini(tit.nombre)}</span>{tit.nombre}</span><span className="mut">· {asgDesde(tit.desde)}</span></span>;
  }
  if (tit && "ex" in tit) {
    return <span className="asgline">{k}<span className="mut asglong">Sin nadie desde el {fcorta(tit.desde)} · la llevaba {tit.ex}</span></span>;
  }
  return <span className="asgline">{k}<span className="mut">Nadie la lleva todavía</span></span>;
}

/** El avatar chico de quien la lleva, para la esquina de la tarjeta `.cmc`. Sin titular no dibuja nada. */
export function AsgAv({ tit }: { tit: Titularidad }) {
  if (!tit || !("staffId" in tit)) return null;
  return <span className="asgav" title={"Lo lleva " + tit.nombre}>{ini(tit.nombre)}</span>;
}

/**
 * La fila «Lo lleva» + el botón que toca según quién mira (Asignar a… / Pasar
 * a… / Tomar / nada), y el bloque de «A quién» que se abre en el mismo cajón.
 */
export function AsgCtl({ objeto, objetoId, operatorId, tit, equipo, yo, noun, abierto }: {
  objeto: Objeto;
  objetoId: string;
  /** De qué operadora es (tarjetas y grupos); null para lo de numan. */
  operatorId: string | null;
  tit: Titularidad;
  equipo: PersonaParaAsignar[];
  yo: Yo;
  /** «operadoras», «tarjetas de Caminante»… para el texto de la lista vacía. */
  noun: string;
  abierto?: boolean;
}) {
  const router = useRouter();
  const me = yo.staffId ? equipo.find((p) => p.id === yo.staffId) ?? null : null;
  const door = !!me && puedeTener(me, objeto, operatorId);
  const v = verboDeAsignacion(tit, yo, door);
  const [modo, setModo] = useState(!!abierto && (v === "asignar" || v === "pasar"));
  const [aviso, setAviso] = useState<[string, string | null] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState("");
  const [pendiente, arranca] = useTransition();
  const titularId = tit && "staffId" in tit ? tit.staffId : null;
  const cand = equipo.filter((p) => puedeTener(p, objeto, operatorId) && p.id !== titularId);
  const tit_ = v === "asignar" ? "Asignar a…" : "Pasar a…";
  const quien = tit ? ("staffId" in tit ? tit.nombre : tit.ex) : "";
  const first = quien.split(" ")[0];
  const txt = tit && "staffId" in tit
    ? `Lo devengado hasta hoy sigue siendo de ${first}. Desde mañana, lo nuevo es de quien la recibe.`
    : tit && "ex" in tit
      ? `Lo devengado hasta el ${fcorta(tit.desde)} sigue siendo de ${first}. Desde mañana, lo nuevo es de quien la recibe.`
      : `En la lista sólo está quien puede llevar ${noun}.`;
  const ok = () =>
    arranca(async () => {
      setError(null);
      const n = cand.find((p) => p.id === a)?.nombre ?? "";
      const r = yo.casa || !titularId ? await asignar(objeto, objetoId, a) : await transferir([{ objeto, objetoId }], a);
      if (!r.ok) { setError(r.error); return; }
      setModo(false);
      setA("");
      setAviso(["Listo", `La lleva ${n} desde hoy.`]);
      router.refresh();
    });
  const tomarla = () =>
    arranca(async () => {
      setError(null);
      const r = await tomar(objeto, objetoId);
      if (!r.ok) { setError(r.error); return; }
      setAviso(["Ya la llevas tú.", null]);
      router.refresh();
    });
  return (
    <>
      <div className="act-row asgrow">
        <LoLleva tit={tit} label />
        {v && !modo ? (
          <button type="button" className="btn btn-sm" disabled={pendiente} onClick={(e) => { e.stopPropagation(); setAviso(null); if (v === "tomar") tomarla(); else setModo(true); }}>
            {v === "tomar" ? "Tomar" : tit_}
          </button>
        ) : null}
      </div>
      {modo ? (
        <div className="upfecha eqcol asgin" onClick={(e) => e.stopPropagation()}>
          <div className="g"><b>{tit_}</b>{txt}</div>
          <label className="sel">A quién<select value={a} onChange={(e) => setA(e.target.value)}><option value="">Elige a alguien del equipo</option>{cand.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
          {cand.length === 0 ? <p className="gnhint" style={{ marginTop: 0 }}>Nadie más en el equipo puede llevar {noun}. Da de alta a alguien primero.</p> : null}
          {error ? <p className="eqerr">{error}</p> : null}
          <div className="ac">
            <button type="button" className="btn btn-orange btn-sm" disabled={!a || pendiente} onClick={ok}>{v === "asignar" ? "Asignar" : "Pasar"}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setModo(false); setA(""); setError(null); }}>Cancelar</button>
          </div>
        </div>
      ) : null}
      {error && !modo ? <p className="eqerr">{error}</p> : null}
      {aviso && !modo ? <div className="verdict si asgin"><span className="n">→</span><span className="g"><b>{aviso[0]}</b>{aviso[1] ? <span>{aviso[1]}</span> : null}</span></div> : null}
    </>
  );
}
