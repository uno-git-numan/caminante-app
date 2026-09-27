"use client";

// RENDIMIENTO — transcrito de la lámina «Equipo» corregida (design/equipo/dc/
// Equipo.html: `Rendimiento`, `FilaNuman`, `FilaCam`, `Cuenta`). Es una
// pestaña dentro de Equipo; sólo la ve uno@numanhub.com, y una operadora ve lo
// de su equipo sin comisiones.
//
// Los datos vienen ya derivados del servidor (`lib/equipo/rendimiento.ts`),
// todos los meses de una vez: son pocos y así el ‹ mes › no recarga.
//
// Lo que la lámina tiene y aquí sale «sin dato» —no cero—: lo PAGADO a cada
// quien (no hay registro), «respondidas en menos de 1 h» (no hay historial de
// etapas por tarjeta), embajadores activados (no hay dato de quién dio de alta
// a quién) y experiencias publicadas por persona. Ver comisiones.ts.

import { useState } from "react";
import type { FilaCamDatos, FilaNumanDatos, Rendimiento as Datos } from "@/lib/equipo/rendimiento";
import { ETAPAS_OPERADORA, type LineaCuenta, type Mes } from "@/lib/equipo/comisiones";

const MESC = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fcorta = (iso: string) => {
  const d = new Date(new Date(iso).getTime() - 6 * 3600_000);
  return `${d.getUTCDate()} ${MESC[d.getUTCMonth()]}`;
};
const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const flarga = (iso: string) => {
  const d = new Date(new Date(iso).getTime() - 6 * 3600_000);
  return `${d.getUTCDate()} de ${MESL[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};
const num = (n: number, dec = 0) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/,/g, "·").replace(/\./g, ",").replace(/·/g, ".");
const mx = (n: number) => (n < 0 ? "−" : "") + "$" + num(Math.abs(n), Math.abs(n) % 1 ? 2 : 0);
const pl = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "—");
const ECHIP: Record<string, string> = { Vendiendo: "c-paid", Expediente: "c-full", "Por firmar": "c-sol", Llamada: "c-draft", Armando: "c-conf" };

const Chev = () => <svg className="chev2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>;
const Flecha = ({ d }: { d: -1 | 1 }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d < 0 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} /></svg>;
const N = ({ v, l }: { v: React.ReactNode; l: string }) => <span className="eqn"><b>{v}</b><small>{l}</small></span>;
const R_ = (k: string, v: React.ReactNode, t?: React.ReactNode) => <div className="pfr" key={k}><span className="k">{k}</span><span className="v">{v}</span><span className="t">{t}</span></div>;

function Cuenta({ c, dev, mes }: { c: LineaCuenta[]; dev: number; mes: Mes }) {
  return (
    <div className="pf" style={{ marginTop: 12 }}>
      <div className="ph"><b>Estado de cuenta</b><span className="fr">{mes.curso ? `Corte el ${mes.corte}` : `Cerrado el ${mes.corte}`}</span></div>
      {c.length === 0 ? <div className="pfr"><span className="k">—</span><span className="v">Nada devengado este mes.</span><span className="t"></span></div> : null}
      {c.map((l, i) => <div key={i} className="pfr"><span className="k">{fcorta(l.fecha)}</span><span className="v">{l.texto}</span><span className={"t eqmx" + (l.monto < 0 ? " neg" : "")}>{l.monto < 0 ? "" : "+"}{mx(l.monto)}</span></div>)}
      <div className="pfr eqtot"><span className="k">Devengado</span><span className="v">{mes.curso ? "Se paga en el corte · sin registro de pagos todavía" : `Corte del ${mes.corte} · sin registro de pago`}</span><span className="t eqmx">{mx(dev)}</span></div>
    </div>
  );
}

function FilaNuman({ nm, d, rank, open, toggle, mes }: { nm: string; d: FilaNumanDatos; rank: number; open: boolean; toggle: () => void; mes: Mes }) {
  const vend = d.etapas.vendiendo;
  return (
    <div className={"actv" + (d.baja ? " nod" : d.dev > 0 ? " aprob" : "") + (open ? " open" : "")}>
      <button type="button" className="ah" onClick={toggle}>
        <span className="g"><b><span className="eqrk">{String(rank).padStart(2, "0")}</span>{nm}</b><small>{d.baja ? `Se fue el ${fcorta(d.baja)}${d.a ? ` · su cartera pasó a ${d.a}` : ""}` : `${pl(d.ops.length, "operadora", "operadoras")} en su cartera · ${vend} vendiendo`}</small></span>
        <span className="rt"><N v={d.tomadas} l="tomadas" /><N v={vend} l="vendiendo" /><N v={mx(d.genera)} l="genera a numan" /><N v={mx(d.dev)} l="devengado" /><Chev /></span>
      </button>
      <div className="ab">
        {d.baja ? <p className="calm" style={{ marginTop: 14 }}><s>{"//"}</s><span className="g"><b>Se fue el {flarga(d.baja)}</b><span>{d.a ? `Sus operadoras pasaron a ${d.a} ese día. ` : ""}Lo que devengó hasta entonces es suyo y se paga en el corte.</span></span></p> : null}
        <p className="xh4" style={{ marginTop: 16 }}>En cada etapa</p>
        <div className="seis">{ETAPAS_OPERADORA.map(([k, t]) => <span key={k} className={"six eqetapa" + (d.etapas[k] ? " ok" : "")}>{t} · {d.etapas[k]}</span>)}</div>
        <div className="pf" style={{ marginTop: 12 }}>
          {[
            R_("Solicitudes tomadas", d.tomadas),
            R_("Días promedio hasta la firma", d.dias == null ? "Ninguna firmada este mes" : pl(d.dias, "día", "días")),
            R_("Operadoras vendiendo", vend),
            R_("Comisión de numan que generan sus operadoras", mx(d.genera) + " sin IVA"),
            R_("Comisión devengada", mx(d.dev), <span className="pill int">10%</span>),
            R_("Pagada", "Sin registro"),
          ]}
        </div>
        {d.ops.length > 0 ? (
          <div className="pf" style={{ marginTop: 12 }}>
            <div className="ph"><b>Su cartera</b><span className="fr">{pl(d.ops.length, "operadora", "operadoras")}</span></div>
            {d.ops.map(([o, e, t]) => <div key={o} className="pfr"><span className="k" style={{ color: "var(--charcoal)", fontSize: 13 }}>{o}</span><span className="v">{t}</span><span className="t"><span className={"chip " + (ECHIP[e] || "c-canc")}><span className="cd"></span>{e}</span></span></div>)}
          </div>
        ) : null}
        <Cuenta c={d.cuenta} dev={d.dev} mes={mes} />
      </div>
    </div>
  );
}

function FilaCam({ nm, d, rank, open, toggle, mes, op }: { nm: string; d: FilaCamDatos; rank: number; open: boolean; toggle: () => void; mes: Mes; op: boolean }) {
  const caidas = d.caidas.reduce((a, [, n]) => a + n, 0);
  return (
    <div className={"actv" + (d.baja ? " nod" : (op ? d.monto : d.dev) > 0 ? " aprob" : "") + (open ? " open" : "")}>
      <button type="button" className="ah" onClick={toggle}>
        <span className="g"><b><span className="eqrk">{String(rank).padStart(2, "0")}</span>{nm}</b><small>{d.baja ? `Se fue el ${fcorta(d.baja)}${d.a ? ` · sus tarjetas pasaron a ${d.a}` : ""}` : `${pl(d.tarjetas, "tarjeta", "tarjetas")} · ${pct(d.pagadas, d.tarjetas)} llegó → pagado`}</small></span>
        <span className="rt">{op ? <N v={d.tarjetas} l="tarjetas" /> : null}<N v={d.lugares} l="lugares" /><N v={mx(d.monto)} l="sin IVA" /><N v={d.nps == null ? "—" : d.nps} l="NPS" />{!op ? <N v={mx(d.dev)} l="devengado" /> : null}<Chev /></span>
      </button>
      <div className="ab">
        {d.baja ? <p className="calm" style={{ marginTop: 14 }}><s>{"//"}</s><span className="g"><b>Se fue el {flarga(d.baja)}</b><span>{d.a ? `Sus tarjetas abiertas pasaron a ${d.a} ese día. ` : ""}Los grupos que ya había cerrado son suyos: se pagan en el corte.</span></span></p> : null}
        <div className="pf" style={{ marginTop: 14 }}>
          {[
            R_("Tarjetas tomadas", d.tarjetas),
            R_("Respondidas en menos de 1 h", "Sin dato · no hay historial de etapas por tarjeta"),
            R_("Llegó → pagado", d.tarjetas ? `${d.pagadas} de ${d.tarjetas} · ${pct(d.pagadas, d.tarjetas)}` : "—"),
            R_("Lugares vendidos", d.lugares),
            R_("Cobrado sin IVA", mx(d.monto)),
            R_("Ticket promedio", d.lugares ? mx(Math.round(d.monto / d.lugares)) : "—"),
            R_("NPS de sus clientes", d.nps == null ? "Sin encuestas todavía" : d.nps),
            R_("Tarjetas caídas", caidas ? `${caidas} · ` + d.caidas.map(([m, n]) => `${m} ${n}`).join(" · ") : "Ninguna"),
            R_("Embajadores activados", "Sin dato"),
            ...(op
              ? [R_("Experiencias publicadas", "Sin dato")]
              : [
                  R_("Comisión devengada", mx(d.dev), <span className="pill int">3% por grupo cerrado</span>),
                  R_("Por devengar", d.porDev ? mx(d.porDev) + " · grupos que todavía no salen" : "Nada pendiente"),
                  ...(d.sinFecha ? [R_("Sin salida", mx(d.sinFecha) + " · reservas sin fecha: no hay grupo que cerrar")] : []),
                  R_("Pagada", "Sin registro"),
                ]),
          ]}
        </div>
        {!op ? <Cuenta c={d.cuenta} dev={d.dev} mes={mes} /> : null}
      </div>
    </div>
  );
}

export default function Rendimiento({ datos, op }: { datos: Datos; op: boolean }) {
  const [tab, setTab] = useState<"numan" | "cam">("numan");
  const [mi, setMi] = useState(datos.meses.length - 1);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const mes = datos.meses[mi];
  const bloque = datos.porMes[mi];
  const D: Record<string, FilaNumanDatos | FilaCamDatos> = op ? bloque.cam : tab === "numan" ? bloque.numan : bloque.cam;
  const key = (d: FilaNumanDatos | FilaCamDatos) => (op ? (d as FilaCamDatos).monto : d.dev);
  const ids = Object.keys(D).sort((a, b) => key(D[b]) - key(D[a]) || (datos.nombres[a] < datos.nombres[b] ? -1 : 1));
  const sinMov = ids.length === 0;
  const esNuman = !op && tab === "numan";
  const cero = !sinMov && ids.every((k) => !key(D[k]) && !(esNuman ? (D[k] as FilaNumanDatos).tomadas : (D[k] as FilaCamDatos).lugares));
  const top = ids[0], hayTop = !!top && key(D[top]) > 0;
  const meta = op
    ? { n: ids.reduce((a, k) => a + (D[k] as FilaCamDatos).lugares, 0), de: 30, t: "lugares vendidos" }
    : esNuman
      ? { n: ids.reduce((a, k) => a + (D[k] as FilaNumanDatos).etapas.vendiendo, 0), de: 3, t: "operadoras nuevas vendiendo" }
      : { n: ids.reduce((a, k) => a + (D[k] as FilaCamDatos).lugares, 0), de: 60, t: "lugares vendidos" };
  const csv = () => {
    const h = esNuman
      ? ["persona", "solicitudes", "llamada", "expediente", "por_firmar", "armando", "vendiendo", "dias_a_firma", "comision_numan_generada", "devengado_10", "pagado"]
      : op
        ? ["persona", "tarjetas", "respondidas_1h", "pagadas", "lugares", "cobrado_sin_iva", "nps", "caidas", "embajadores", "publicadas"]
        : ["persona", "tarjetas", "respondidas_1h", "pagadas", "lugares", "cobrado_sin_iva", "nps", "caidas", "embajadores", "devengado_3", "por_devengar", "pagado"];
    const rows = ids.map((k) => {
      const nm = datos.nombres[k];
      if (esNuman) { const d = D[k] as FilaNumanDatos; return [nm, d.tomadas, ...ETAPAS_OPERADORA.map(([e]) => d.etapas[e]), d.dias ?? "", d.genera, d.dev, ""]; }
      const d = D[k] as FilaCamDatos; const cd = d.caidas.reduce((a, [, n]) => a + n, 0);
      return op ? [nm, d.tarjetas, "", d.pagadas, d.lugares, d.monto, d.nps ?? "", cd, "", ""] : [nm, d.tarjetas, "", d.pagadas, d.lugares, d.monto, d.nps ?? "", cd, "", d.dev, d.porDev, ""];
    });
    const txt = [h, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv" }));
    a.download = `rendimiento-${op ? "equipo" : tab}-${mes.k}.csv`;
    a.click();
  };
  return (
    <div>
      <div className="eqmesrow">
        <div className="eqmes">
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Mes anterior" disabled={mi === 0} onClick={() => { setMi(mi - 1); setOpen({}); }}><Flecha d={-1} /></button>
          <b>{mes.t}</b>
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Mes siguiente" disabled={mi === datos.meses.length - 1} onClick={() => { setMi(mi + 1); setOpen({}); }}><Flecha d={1} /></button>
          <span>{mes.curso ? `Corte el ${mes.corte} · lo que va del mes` : `Cerrado el ${mes.corte}`}</span>
        </div>
        {!sinMov ? <button type="button" className="btn btn-ghost btn-sm" onClick={csv}>Exportar CSV</button> : null}
      </div>
      {sinMov ? (
        <p className="calm"><s>{"//"}</s><span className="g"><b>Nadie atribuyó nada en {mes.m}.</b></span></p>
      ) : (
        <>
          {!op ? (
            <div className="opseg eqseg">
              {([["numan", "numan", "10% de la comisión"], ["cam", "Caminante", "3% por grupo cerrado"]] as const).map(([k, t, no]) => (
                <button key={k} type="button" className={tab === k ? "on" : ""} onClick={() => { setTab(k); setOpen({}); }}>{t}<span className="no">{no}</span></button>
              ))}
            </div>
          ) : null}
          <div className="nowgrid" style={{ marginBottom: 16 }}>
            <div className="nowcard"><span className="lb">La meta del mes</span><b className="t">{meta.de} {meta.t}</b><span className="mn">{meta.n} de {meta.de}</span><div className="docbar" style={{ marginTop: 12 }}><span className="bar"><i style={{ width: Math.min(100, (meta.n / meta.de) * 100) + "%" }}></i></span></div></div>
            <div className="nowcard"><span className="lb">{mes.curso ? "Va primero" : "Quedó primero"}</span>{hayTop ? <><b className="t">{datos.nombres[top]}</b><span className="mn">{mx(key(D[top]))}</span><p>{op ? `Cobrado sin IVA · ${(D[top] as FilaCamDatos).lugares} lugares` : esNuman ? `Devengado · ${(D[top] as FilaNumanDatos).etapas.vendiendo} operadora vendiendo` : `Devengado · ${(D[top] as FilaCamDatos).lugares} lugares`}.</p></> : <><b className="t">Nadie todavía</b><p>Se decide con el primer cierre del mes.</p></>}</div>
          </div>
          {cero ? <div className="verdict casa"><span className="n">00</span><span className="g"><b>Nada cerrado todavía este mes</b><span>{esNuman ? "Los números se llenan cuando la primera operadora de alguien venda." : "Los números se llenan cuando salga el primer grupo."} Las tarjetas y las solicitudes abiertas siguen corriendo.</span></span></div> : null}
          <div className="acts">
            {ids.map((k, i) => {
              const P = { nm: datos.nombres[k] ?? "—", rank: i + 1, mes, open: !!open[k], toggle: () => setOpen((o) => ({ ...o, [k]: !o[k] })) };
              return esNuman ? <FilaNuman key={k} {...P} d={D[k] as FilaNumanDatos} /> : <FilaCam key={k} {...P} d={D[k] as FilaCamDatos} op={op} />;
            })}
          </div>
        </>
      )}
      <p className="gnhint" style={{ maxWidth: "74ch" }}>
        {op
          ? "Aquí ves lo que mueve tu equipo con tus clientes. Lo que le pagas a cada quien lo arreglas tú; numan no lo calcula."
          : "numan: 10% de la comisión que numan cobra a cada operadora atribuida, mientras la persona siga en el equipo. Caminante: 3% de lo cobrado sin IVA de sus lugares cuando la salida ya ocurrió. El 1% de los clientes de sus embajadoras todavía no se calcula: no existe el dato de quién llegó por quién. Una devolución resta del pago que devolvió, aunque el mes ya hubiera cerrado."}
      </p>
    </div>
  );
}
