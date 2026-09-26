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
// «Transferir cartera» (0071) es el `Transferir` de la lámina: lo que la
// persona tiene abierto (operadoras y solicitudes de numan; tarjetas y grupos
// de su operadora) pasa a otra persona del equipo que pueda llevarlo. La línea
// «Hoy» sale del libro de atribuciones, no de un relleno.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agregarAlEquipo, cambiarFacultades, darDeBaja } from "@/lib/equipo/actions";
import { transferir } from "@/lib/equipo/atribucion-actions";
import { lineaDeHoy, OBJETO, type Objeto } from "@/lib/equipo/atribucion-reglas";
import { FACULTAD, FACULTADES, type Facultad } from "@/lib/equipo/facultades";
import type { CosaEnCartera, MiembroEnPantalla } from "@/lib/equipo/lista";

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
/** PCheck del sistema de diseño, con su markup. */
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="cmn-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="cmn-check__box"></span>
      <span className="cmn-check__text">{label}</span>
    </label>
  );
}
const porObjeto = (c: CosaEnCartera[]): Record<Objeto, string[]> => ({
  solicitud: c.filter((x) => x.objeto === "solicitud").map((x) => x.id),
  operadora: c.filter((x) => x.objeto === "operadora").map((x) => x.id),
  tarjeta: c.filter((x) => x.objeto === "tarjeta").map((x) => x.id),
  grupo: c.filter((x) => x.objeto === "grupo").map((x) => x.id),
});
/** La línea «Hoy», del libro (0071). */
const estadoLinea = (m: MiembroEnPantalla, scope: "casa" | "op") =>
  lineaDeHoy(porObjeto(m.cartera), { numan: scope === "casa" && m.numan, operadora: scope === "op" || esOp(m) });
const ops = (m: MiembroEnPantalla) => m.cartera.filter((x) => OBJETO[x.objeto].de === "numan");
const tarj = (m: MiembroEnPantalla) => m.cartera.filter((x) => OBJETO[x.objeto].de === "operadora");
const LADO = (o: Objeto) => (OBJETO[o].de === "numan" ? "ops" : "tarj");

/** Transferir cartera — transcrito de la lámina (`Transferir`). */
function Transferir({ m, todos, scope, onDone, onCancel }: { m: MiembroEnPantalla; todos: MiembroEnPantalla[]; scope: "casa" | "op"; onDone: (n: number) => void; onCancel: () => void }) {
  const router = useRouter();
  const ops = m.cartera.filter((x) => LADO(x.objeto) === "ops");
  const tarj = m.cartera.filter((x) => LADO(x.objeto) === "tarj");
  const kinds = [ops.length && "ops", tarj.length && "tarj"].filter(Boolean) as ("ops" | "tarj")[];
  const [kind, setKind] = useState<"ops" | "tarj">(kinds[0] ?? "ops");
  const cand = todos.filter((x) => x.id !== m.id && x.activo && (kind === "ops" ? x.numan : scope === "op" || esOp(x)));
  const [a, setA] = useState("");
  const [todo, setTodo] = useState(true);
  const [sel, setSel] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, arranca] = useTransition();
  const items = kind === "ops" ? ops : tarj;
  const lista = todo ? items : items.filter((x) => sel.includes(x.id));
  const nom = kind === "ops" ? ["operadora", "operadoras"] : ["tarjeta", "tarjetas"];
  const hacer = () =>
    arranca(async () => {
      const r = await transferir(lista.map((x) => ({ objeto: x.objeto, objetoId: x.id })), a);
      if (!r.ok) { setAviso(r.error); return; }
      router.refresh();
      onDone(r.hechas ?? lista.length);
    });
  return (
    <div className="upfecha eqcol">
      <div className="g"><b>Transferir cartera</b>Lo devengado hasta hoy sigue siendo de {m.nombre.split(" ")[0]}. Desde mañana, lo nuevo es de quien la recibe.</div>
      {kinds.length > 1 ? (
        <div className="opts" style={{ margin: 0 }}>
          {kinds.map((k) => <button key={k} type="button" className={"opt" + (kind === k ? " on" : "")} onClick={() => { setKind(k); setSel([]); setA(""); }}><i></i>{k === "ops" ? pl(ops.length, "operadora", "operadoras") : pl(tarj.length, "tarjeta", "tarjetas")}</button>)}
        </div>
      ) : null}
      <label className="sel">A quién<select value={a} onChange={(e) => setA(e.target.value)}><option value="">Elige a alguien del equipo</option>{cand.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
      {cand.length === 0 ? <p className="gnhint" style={{ marginTop: 0 }}>Nadie más en el equipo puede recibir {nom[1]}. Da de alta a alguien primero.</p> : null}
      <div className="opts" style={{ margin: 0 }}>
        <button type="button" className={"opt" + (todo ? " on" : "")} onClick={() => setTodo(true)}><i></i>{kind === "ops" ? "Todas sus operadoras" : "Todas sus tarjetas"}</button>
        <button type="button" className={"opt" + (!todo ? " on" : "")} onClick={() => setTodo(false)}><i></i>Algunas</button>
      </div>
      {!todo ? <div className="eqlist">{items.map((it) => <Check key={it.id} label={it.nombre} checked={sel.includes(it.id)} onChange={(v) => setSel((s) => (v ? [...s, it.id] : s.filter((x) => x !== it.id)))} />)}</div> : null}
      {aviso ? <p className="eqerr">{aviso}</p> : null}
      <div className="ac">
        <button type="button" className="btn btn-orange btn-sm" disabled={!a || !lista.length || pendiente} onClick={hacer}>{lista.length ? `Transferir ${pl(lista.length, nom[0], nom[1])}` : "Transferir"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function Persona({ m, todos, scope, operadora }: { m: MiembroEnPantalla; todos: MiembroEnPantalla[]; scope: "casa" | "op"; operadora?: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<null | "baja" | "trans">(null);
  const cartera = m.cartera.length;
  const [hecho, setHecho] = useState<string | null>(null);
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
      if (!r.ok) { setAviso(r.error); setModo(null); return; }
      setModo(null);
      router.refresh();
    });
  const carteraTxt = [ops(m).length && pl(ops(m).length, "operadora", "operadoras"), tarj(m).length && pl(tarj(m).length, "tarjeta", "tarjetas")].filter(Boolean).join(" y ");

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
          {hecho && !modo ? <div className="verdict si eqin"><span className="n">→</span><span className="g"><b>{hecho}</b><span>Lo devengado hasta hoy sigue siendo de {first}.</span></span></div> : null}
          {modo === "trans" ? <div className="eqin"><Transferir m={m} todos={todos} scope={scope} onCancel={() => setModo(null)} onDone={(n) => { setModo(null); setHecho(`Transferido: ${n}.`); }} /></div> : null}
          {modo === "baja" ? (
            <div className="calm eqin eqbaja">
              <s>{"//"}</s>
              <span className="g">
                <b>¿{scope === "op" ? `Quitar a ${m.nombre} de tu equipo` : `Dar de baja a ${m.nombre}`}?</b>
                <span>{scope === "op" ? `Deja de ver lo de ${operadora ?? "tu operadora"} ahora mismo.` : "Pierde el panel ahora mismo; lo que atribuyó hasta hoy sigue siendo suyo."}{cartera ? ` Su cartera (${carteraTxt}) tiene que pasar a alguien primero.` : ""}</span>
              </span>
              <span className="ac">
                <button type="button" className="btn btn-sm" disabled={pendiente} onClick={baja}>{scope === "op" ? "Sí, quitarle" : "Sí, dar de baja"}</button>
                {cartera > 0 ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModo("trans")}>Transferir primero</button> : null}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModo(null)}>Cancelar</button>
              </span>
            </div>
          ) : null}
          {!modo ? (
            <div className="salfoot eqfoot">
              {cartera > 0 ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAviso(null); setHecho(null); setModo("trans"); }}>Transferir cartera</button> : null}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAviso(null); setHecho(null); setModo("baja"); }}>{scope === "op" ? "Quitar de mi equipo" : "Dar de baja"}</button>
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
        {lista.map((m) => <Persona key={m.id} m={m} todos={lista} scope={scope} operadora={modo.casa ? undefined : modo.nombre} />)}
      </div>
      {bajas.length > 0 ? (
        <details className="eqbajas">
          <summary>Bajas · {bajas.length}</summary>
          <div className="pf">
            {bajas.map((b) => (
              <div key={b.id} className="pfr">
                <span className="k">{b.nombre}<br /><span className="eqmail">{b.email}</span></span>
                <span className="v">Se fue el {b.bajaAt ? fecha(b.bajaAt) : "—"}{b.carteraPasoA.length ? ` · su cartera pasó a ${b.carteraPasoA.join(" y ")}` : ""}. Lo que atribuyó hasta ese día sigue siendo suyo.</span>
                <span className="t"><span className="pill lock">Sin acceso</span></span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
