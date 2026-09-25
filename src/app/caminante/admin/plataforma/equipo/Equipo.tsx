"use client";

// EL EQUIPO — transcrito de la lámina «Equipo» (design/equipo/dc/Equipo.html,
// recurso f96c4ae0: `EquipoScreen`, `Persona`, `Alta`). Dos modos con la misma
// pantalla: la CASA (todos; numan y cualquier operadora; cuatro facultades) y
// una OPERADORA (los suyos; sólo ella; tres facultades). El servidor vuelve a
// decidir todo (`lib/equipo/actions.ts`); aquí sólo se ofrece lo que ese modo
// puede pedir.
//
// Los controles del sistema de diseño (PSwitch, PInput, PCheck) se transcriben
// con su propio markup (`.cmn-switch`, `.cmn-field`) y su CSS viaja en
// equipo-css.ts. Los botones PBtn son los `.btn` del panel, como siempre.
//
// ⚠️ «TRANSFERIR CARTERA» NO ESTÁ: la cartera (operadoras tomadas, tarjetas)
// nace con la atribución (0071+). La lámina ya esconde el botón cuando la
// cartera es cero, que es exactamente el caso hoy; la línea «Hoy» dice
// «Todavía sin…» porque es verdad, no un relleno.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agregarAlEquipo, cambiarFacultades, darDeBaja } from "@/lib/equipo/actions";
import { FACULTAD, FACULTADES, type Facultad } from "@/lib/equipo/facultades";
import type { MiembroEnPantalla } from "@/lib/equipo/lista";

export type ModoEquipo =
  | { casa: true; operadoras: { id: string; nombre: string }[] }
  | { casa: false; operatorId: string; nombre: string; porOtra: boolean; ligaAlta: string; ligaPerfil: string };

const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const fecha = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} de ${MES[d.getMonth()]} de ${d.getFullYear()}`;
};
const ini = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");
const pl = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
const CHIPC = (nombre: string) =>
  nombre === "numan" ? "c-full" : nombre === "Kéntro" ? "c-sol" : "c-paid";

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="eyebrow"><span className="sl">{"//"}</span> {children}</span>
);
const Para = ({ para }: { para: string[] }) => (
  <span className="eqchips">
    {para.map((p) => <span key={p} className={"chip " + CHIPC(p)}><span className="cd"></span>{p}</span>)}
  </span>
);
/** PSwitch del sistema de diseño, con su markup. */
function Switch({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={"cmn-switch" + (disabled ? " cmn-switch--disabled" : "")}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="cmn-switch__track"><span className="cmn-switch__thumb"></span></span>
      <span className="cmn-switch__label">{label}</span>
    </label>
  );
}
/** PInput del sistema de diseño, con su markup. */
function Input({ label, value, placeholder, help, error, type, onChange }: { label: string; value: string; placeholder?: string; help?: string; error?: boolean; type?: string; onChange: (v: string) => void }) {
  return (
    <div className={"cmn-field" + (error ? " cmn-field--error" : "")}>
      <label className="cmn-field__label">{label}</label>
      <div className="cmn-input-wrap">
        <input className="cmn-input" type={type ?? "text"} value={value} placeholder={placeholder} aria-invalid={error || undefined} onChange={(e) => onChange(e.target.value)} />
      </div>
      {help ? <span className="cmn-field__help">{help}</span> : null}
    </div>
  );
}

const paraDe = (m: MiembroEnPantalla, scope: "casa" | "op"): string[] =>
  scope === "op" ? [] : [...(m.numan ? ["numan"] : []), ...m.operadoras.map((o) => o.nombre)];
const esOp = (m: MiembroEnPantalla) => m.operadoras.length > 0;
const facOK = (k: Facultad, m: { numan: boolean; operadoras: unknown[] }, scope: "casa" | "op") =>
  scope === "op" ? k !== "onboarding" : FACULTAD[k].de === "numan" ? m.numan : m.operadoras.length > 0;
/** La línea «Hoy». Sin atribución (0071+) todavía no hay cartera, y se dice. */
const estadoLinea = (m: MiembroEnPantalla, scope: "casa" | "op") => {
  const n = scope === "op" ? false : m.numan, o = scope === "op" || esOp(m);
  if (n && o) return "0 operadoras en su cartera · 0 tarjetas abiertas";
  if (n) return "Todavía sin operadoras en su cartera";
  return "Todavía sin tarjetas";
};

function Persona({ m, scope, operadora }: { m: MiembroEnPantalla; scope: "casa" | "op"; operadora?: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<null | "baja">(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const plegable = scope === "casa";
  const [abierto, setAbierto] = useState(!plegable);
  const [fac, setFac] = useState<Facultad[]>(m.facultades);
  const [pendiente, arranca] = useTransition();
  const facs = FACULTADES.filter((k) => scope === "casa" || k !== "onboarding");
  const prendidas = facs.filter((k) => fac.includes(k) && facOK(k, m, scope));
  const first = m.nombre.split(" ")[0];
  const para = paraDe(m, scope);

  const setFacultad = (k: Facultad, v: boolean) => {
    const nuevas = v ? [...fac.filter((x) => x !== k), k] : fac.filter((x) => x !== k);
    setFac(nuevas);
    arranca(async () => {
      const r = await cambiarFacultades(m.id, nuevas);
      if (!r.ok) { setFac(fac); setAviso(r.error); }
      else router.refresh();
    });
  };
  const baja = () =>
    arranca(async () => {
      const r = await darDeBaja(m.id);
      if (!r.ok) setAviso(r.error);
      setModo(null);
      router.refresh();
    });

  const cab = (
    <>
      <span className="pchip" style={{ padding: "4px 12px 4px 4px", fontSize: 13, fontWeight: 500 }}><span className="av">{ini(m.nombre)}</span>{m.nombre}</span>
      <span className="eqmail">{m.email}</span>
      <span className="eqdesde">Desde el {fecha(m.altaAt)}</span>
      {plegable && !abierto ? <span className="eqsum"><Para para={para} /><span>{estadoLinea(m, scope)}</span></span> : null}
    </>
  );
  return (
    <div className={"pf eqp" + (plegable ? " eqpleg" : "") + (abierto ? " open" : "")}>
      {plegable ? (
        <button type="button" className="ph eqtog" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
          <span className="eqtogg">{cab}</span>
          <svg className="chev2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      ) : (
        <div className="ph">{cab}</div>
      )}
      {abierto ? (
        <>
          {scope === "casa" ? <div className="pfr"><span className="k">Trabaja para</span><span className="v"><Para para={para} /></span><span className="t"></span></div> : null}
          <div className="pfr"><span className="k">Hoy</span><span className="v">{estadoLinea(m, scope)}</span><span className="t"></span></div>
          <div className="eqfac">
            {facs.map((k) => {
              const ok = facOK(k, m, scope);
              return (
                <div key={k} className={"eqf" + (ok ? "" : " off")}>
                  <Switch label={FACULTAD[k].nombre} checked={fac.includes(k) && ok} disabled={!ok || pendiente} onChange={(v) => setFacultad(k, v)} />
                  <small>{ok ? FACULTAD[k].que : FACULTAD[k].de === "numan" ? "Sólo para quien trabaja con numan." : "Sólo para quien trabaja con una operadora."}</small>
                </div>
              );
            })}
          </div>
          {prendidas.length === 0 ? (
            <div className="calm eqin"><s>{"//"}</s><span className="g"><b>Entra y mira, no toca</b><span>Con todo apagado, {first} ve el panel pero no puede mover nada. Préndele lo que vaya a hacer.</span></span></div>
          ) : null}
          {aviso && !modo ? <div className="verdict no eqin"><span className="n">{"//"}</span><span className="g"><b>No se pudo</b><span>{aviso}</span></span></div> : null}
          {modo === "baja" ? (
            <div className="calm eqin eqbaja">
              <s>{"//"}</s>
              <span className="g">
                <b>¿{scope === "op" ? `Quitar a ${m.nombre} de tu equipo` : `Dar de baja a ${m.nombre}`}?</b>
                <span>{scope === "op" ? `Deja de ver lo de ${operadora ?? "tu operadora"} ahora mismo.` : "Pierde el panel ahora mismo; lo que atribuyó hasta hoy sigue siendo suyo."}</span>
              </span>
              <span className="ac">
                <button type="button" className="btn btn-sm" disabled={pendiente} onClick={baja}>{scope === "op" ? "Sí, quitarle" : "Sí, dar de baja"}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModo(null)}>Cancelar</button>
              </span>
            </div>
          ) : null}
          {!modo ? (
            <div className="salfoot eqfoot">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAviso(null); setModo("baja"); }}>{scope === "op" ? "Quitar de mi equipo" : "Dar de baja"}</button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Alta({ modo, todos, onClose }: { modo: ModoEquipo; todos: MiembroEnPantalla[]; onClose: (nombre: string | null) => void }) {
  const scope: "casa" | "op" = modo.casa ? "casa" : "op";
  const router = useRouter();
  const [f, setF] = useState<{ correo: string; nombre: string; para: string[]; fac: Facultad[] }>({ correo: "", nombre: "", para: [], fac: [] });
  const [tried, setTried] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [pendiente, arranca] = useTransition();
  const c = f.correo.trim().toLowerCase();
  const err = !c
    ? "Falta el correo."
    : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)
      ? "Ese correo no se ve completo."
      : scope === "casa" && !c.endsWith("@numanhub.com")
        ? "El equipo de la casa entra con su correo @numanhub.com."
        : todos.some((x) => x.email === c && x.activo)
          ? "Esa persona ya está en el equipo."
          : errorServidor;
  const errN = !f.nombre.trim() ? "Falta el nombre." : null;
  const errP = scope === "casa" && !f.para.length ? "Elige para quién trabaja." : null;
  const paraTmp = { numan: scope === "casa" && f.para.includes("numan"), operadoras: scope === "casa" ? f.para.filter((x) => x !== "numan") : [modo.casa ? "" : modo.operatorId] };
  const facs = FACULTADES.filter((k) => scope === "casa" || k !== "onboarding");
  const opciones = modo.casa ? modo.operadoras : [];
  const listo = !err && !errN && !errP;
  const guardar = () => {
    setTried(true);
    if (!listo) return;
    arranca(async () => {
      setErrorServidor(null);
      const r = await agregarAlEquipo({
        email: c,
        nombre: f.nombre.trim(),
        numan: paraTmp.numan,
        operadoras: modo.casa ? f.para.filter((x) => x !== "numan") : undefined,
        facultades: facs.filter((k) => f.fac.includes(k) && facOK(k, paraTmp, scope)),
      });
      if (!r.ok) { setErrorServidor(r.error); return; }
      router.refresh();
      onClose(f.nombre.trim());
    });
  };
  const togglePara = (x: string) => setF({ ...f, para: f.para.includes(x) ? f.para.filter((y) => y !== x) : [...f.para, x] });
  return (
    <div className="pf eqalta">
      <div className="ph"><b>Dar de alta</b><span className="fr">Sin contraseña: entra con su correo.</span></div>
      <div className="eqbody">
        <div className="fldrow" style={{ marginTop: 0 }}>
          <Input label="Correo" type="email" value={f.correo} placeholder={scope === "casa" ? "nombre@numanhub.com" : "nombre@correo.com"} error={tried && !!err} help={tried && err ? err : scope === "casa" ? "Su correo @numanhub.com. Con ése entra." : "Con ése entra. No le pedimos contraseña."} onChange={(v) => { setErrorServidor(null); setF({ ...f, correo: v }); }} />
          <Input label="Nombre" value={f.nombre} error={tried && !!errN} help={tried && errN ? errN : ""} onChange={(v) => setF({ ...f, nombre: v })} />
        </div>
        {scope === "casa" ? (
          <div>
            <p className="xh4" style={{ marginTop: 16 }}>Para quién trabaja</p>
            <div className="seis">
              {[{ id: "numan", nombre: "numan" }, ...opciones].map((x) => {
                const on = f.para.includes(x.id);
                return <button key={x.id} type="button" className={"six eqsix" + (on ? " ok" : "")} onClick={() => togglePara(x.id)}>{on ? "✓ " : ""}{x.nombre}</button>;
              })}
            </div>
            {tried && errP ? <p className="eqerr">{errP}</p> : null}
          </div>
        ) : null}
        <p className="xh4" style={{ marginTop: 16 }}>Qué puede hacer</p>
        <div className="eqfac" style={{ padding: 0, border: 0 }}>
          {facs.map((k) => {
            const ok = facOK(k, paraTmp, scope);
            return (
              <div key={k} className={"eqf" + (ok ? "" : " off")}>
                <Switch label={FACULTAD[k].nombre} checked={f.fac.includes(k) && ok} disabled={!ok} onChange={(v) => setF({ ...f, fac: v ? [...f.fac, k] : f.fac.filter((x) => x !== k) })} />
                <small>{ok ? FACULTAD[k].que : scope === "casa" && !f.para.length ? "Primero elige para quién trabaja." : FACULTAD[k].de === "numan" ? "Sólo para quien trabaja con numan." : "Sólo para quien trabaja con una operadora."}</small>
              </div>
            );
          })}
        </div>
        <div className="salfoot">
          <button type="button" className="btn btn-orange btn-sm" disabled={pendiente} onClick={guardar}>{pendiente ? "Guardando…" : "Dar de alta"}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onClose(null)}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Equipo({ miembros, modo }: { miembros: MiembroEnPantalla[]; modo: ModoEquipo }) {
  const scope: "casa" | "op" = modo.casa ? "casa" : "op";
  const lista = miembros.filter((m) => m.activo);
  const bajas = modo.casa ? miembros.filter((m) => !m.activo) : [];
  const [alta, setAlta] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  return (
    <div>
      <div className="sec-head">
        <div>
          <Eyebrow>{!modo.casa ? (modo.porOtra ? `Equipo de ${modo.nombre}` : "Tu equipo") : "Equipo"}</Eyebrow>
          <h2 className="display" style={{ marginTop: 10 }}>
            {scope === "op" ? <>Quien trabaja contigo <em className="ac">entra con su correo.</em></> : <>Quién trabaja aquí, <em className="ac">y qué puede.</em></>}
          </h2>
          <p className="desc">{scope === "op" ? "Le prendes sólo lo que necesita, y lo apagas cuando quieras." : "Cada persona entra con su correo @numanhub.com y ve sólo lo que le prendes."}</p>
        </div>
        {!alta ? <button type="button" className="btn btn-orange btn-sm" onClick={() => { setOk(null); setAlta(true); }}>Dar de alta</button> : null}
      </div>
      {!modo.casa ? (
        <>
          <p className="calm" style={{ marginBottom: 14 }}><s>{"//"}</s><span className="g"><b>Tus cobros, tus devoluciones y tu convenio siguen siendo tuyos</b><span>Nadie de tu equipo los ve. Aquí sólo decides quién atiende a tus clientes, quién arma tus experiencias y quién va a campo.</span></span></p>
          <p className="eqback"><a href={modo.ligaAlta}>← {modo.porOtra ? "Su alta" : "Mi alta"}</a></p>
        </>
      ) : null}
      {alta ? <Alta modo={modo} todos={miembros} onClose={(n) => { setAlta(false); if (n) setOk(n); }} /> : null}
      {ok ? <div className="verdict si" style={{ marginTop: alta ? 14 : 0 }}><span className="n">→</span><span className="g"><b>{ok} ya puede entrar</b><span>Entra con su correo y ve sólo lo que le prendiste. Si no le prendiste nada, mira pero no toca.</span></span></div> : null}
      {lista.length === 0 && !alta ? <div className="verdict casa"><span className="n">00</span><span className="g"><b>Todavía nadie.</b><span>La primera persona entra con su correo y ve sólo lo que le prendas.</span></span></div> : null}
      <div className="eqgrid">
        {lista.map((m) => <Persona key={m.id} m={m} scope={scope} operadora={modo.casa ? undefined : modo.nombre} />)}
      </div>
      {bajas.length > 0 ? (
        <details className="eqbajas">
          <summary>Bajas · {bajas.length}</summary>
          <div className="pf">
            {bajas.map((b) => (
              <div key={b.id} className="pfr">
                <span className="k">{b.nombre}<br /><span className="eqmail">{b.email}</span></span>
                <span className="v">Se fue el {b.bajaAt ? fecha(b.bajaAt) : "—"}. Lo que atribuyó hasta ese día sigue siendo suyo.</span>
                <span className="t"><span className="pill lock">Sin acceso</span></span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
