"use client";

// Piezas presentacionales de la app de admin en móvil.
//
// Transcritas VERBATIM de design/admin-movil/adm-core.jsx (Claude Design). Lo
// único que cambia es lo que exige React real y no el prototipo con Babel en el
// navegador: tipos, `export` en vez de Object.assign(window, …), y className en
// lugar de class. El markup y las clases NO se tocan — el CSS depende de ellos.
//
// Lo que NO se porta: el objeto INIT (datos de ejemplo del prototipo). Los datos
// reales vienen de src/lib/admin/queries.ts.

import type { ReactNode } from "react";

export const fmt = (n: number) =>
  "$" + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtS = (n: number) => (n < 0 ? "−" : "+") + fmt(n);
export const fmtD = (n: number) => {
  const s = Math.abs(n).toFixed(2).replace(".", ",");
  return (n < 0 ? "−$" : "$") + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const Chip = ({ c, dot, children }: { c: string; dot?: boolean; children: ReactNode }) => (
  <span className={"adm-chip adm-c-" + c}>
    {dot && <span className="cd"></span>}
    {children}
  </span>
);

export const Chev = () => <span className="adm-chev">⌄</span>;

export const Prow = ({ l, w, fr, warn }: { l: ReactNode; w?: number | null; fr: ReactNode; warn?: boolean }) => (
  <div className={"adm-prow" + (warn ? " warn" : "")}>
    <span>{l}</span>
    <div className="tk">{w != null && <i style={{ width: w + "%" }}></i>}</div>
    <span className="fr">{fr}</span>
  </div>
);

export const ProwN = ({ l, fr, b }: { l: ReactNode; fr: ReactNode; b?: boolean }) => (
  <div className="adm-prow">
    <span>{b ? <b>{l}</b> : l}</span>
    <div></div>
    <span className="fr" style={b ? { color: "var(--charcoal)", fontWeight: 600 } : undefined}>
      {fr}
    </span>
  </div>
);

export const Sub = ({ children, pad }: { children: ReactNode; pad?: boolean }) => (
  <span className={"adm-sub" + (pad ? " pad" : "")}>{children}</span>
);

export const Gap = ({ s }: { s?: boolean }) => <div className={s ? "adm-gap-s" : "adm-gap"}></div>;

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="adm-eyebrow">
    <span className="sl">{"//"}</span> {children}
  </span>
);

// La hora se calcula en el cliente: en el servidor daría la del servidor y
// además rompería la hidratación.
export const Status = ({ warnTxt, hora }: { warnTxt?: string | null; hora: string }) => (
  <div className="adm-status">
    <span className="adm-mono">{hora}</span>
    <span
      className="adm-mono"
      style={warnTxt ? { color: "#e8431f", fontWeight: 700 } : { color: "var(--ink-soft)" }}
    >
      {warnTxt || "LTE ▮▮▮"}
    </span>
  </div>
);

export const Head = ({ eyebrow, title, action }: { eyebrow: ReactNode; title: string; action?: ReactNode }) => (
  <header className="adm-head">
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="adm-display" dangerouslySetInnerHTML={{ __html: title }}></h1>
    </div>
    {action}
  </header>
);

export const NavBar = ({
  onBack,
  t,
  s,
  right,
}: {
  onBack: () => void;
  t: ReactNode;
  s?: ReactNode;
  right?: ReactNode;
}) => (
  <div className="adm-nav">
    <button className="bk" onClick={onBack} aria-label="Regresar">
      ‹
    </button>
    <div className="tt">
      <b>{t}</b>
      <small>{s}</small>
    </div>
    {right}
  </div>
);

export const Fld = ({
  l,
  val,
  set,
  hint,
  err,
  mono,
  type,
  ph,
}: {
  l: ReactNode;
  val: string;
  set?: (v: string) => void;
  hint?: ReactNode;
  err?: boolean;
  mono?: boolean;
  type?: string;
  ph?: string;
}) => (
  <div className={"adm-fld" + (err ? " err" : "")}>
    <label>{l}</label>
    <input
      className={mono ? "mono-in" : ""}
      type={type || "text"}
      value={val}
      placeholder={ph}
      onChange={(e) => set && set(e.target.value)}
      readOnly={!set}
    />
    <span className="hint">{hint}</span>
  </div>
);

// Hermano de `Fld` para las listas cerradas (experiencia, salida, visibilidad):
// mismo bloque `.adm-fld`, que el CSS del entregable ya estila para `select`.
// El entregable resuelve todo con `Fld`, pero teclear un slug a mano en el
// teléfono ya costó errores en el cobro de escritorio.
export const Sel = ({
  l,
  val,
  set,
  hint,
  opts,
}: {
  l: ReactNode;
  val: string;
  set: (v: string) => void;
  hint?: ReactNode;
  opts: { v: string; t: string }[];
}) => (
  <div className="adm-fld">
    <label>{l}</label>
    <select value={val} onChange={(e) => set(e.target.value)}>
      {opts.map((o) => (
        <option key={o.v} value={o.v}>
          {o.t}
        </option>
      ))}
    </select>
    <span className="hint">{hint}</span>
  </div>
);

export const Seg = ({ opts, val, set }: { opts: string[]; val: string; set: (v: string) => void }) => (
  <div className="adm-seg">
    {opts.map((o) => (
      <button key={o} className={o === val ? "on" : ""} onClick={() => set(o)}>
        {o}
      </button>
    ))}
  </div>
);

export const CopyBox = ({ v, txt, onCopy }: { v: string; txt?: boolean; onCopy: (v: string) => void }) => (
  <div className="adm-copy">
    <span className={"cv" + (txt ? " txt" : "")}>{v}</span>
    <button onClick={() => onCopy(v)}>COPIAR</button>
  </div>
);

const LIFE: Record<string, string> = {
  "falta insumo": "lf-miss",
  // Una pieza trabada por FOTOS se dice a la cara (se destraba subiendo fotos,
  // no completando la ficha) — el tablero de escritorio ya distingue las dos.
  "faltan fotos": "lf-miss",
  "sin caption": "lf-nocap",
  lista: "lf-ready",
  programada: "lf-sched",
  publicada: "lf-pub",
  "falló": "lf-fail",
  listo: "lf-ready",
  revisar: "lf-nocap",
  "faltan 2": "lf-miss",
  activa: "lf-ready",
  "prog.": "lf-sched",
};

export const Life = ({ e }: { e: string }) => (
  <span className={"adm-life " + (LIFE[e] || "lf-ready")}>
    <i></i>
    {e}
  </span>
);

export const Empty = ({ ic, t, p, btn }: { ic: ReactNode; t: ReactNode; p: ReactNode; btn?: ReactNode }) => (
  <div className="adm-state">
    <span className="ic">{ic}</span>
    <h3>{t}</h3>
    <p>{p}</p>
    {btn}
  </div>
);

export const TabIcon: Record<string, ReactNode> = {
  panorama: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2.5 12.5h3l2.5-6 4 10 2.5-6h5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eventos: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="4.5" width="16" height="14" rx="3" strokeWidth="1.75" />
      <path d="M3 9h16M7.5 2.75v3.5M14.5 2.75v3.5" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  gente: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="8" cy="8" r="3.25" strokeWidth="1.75" />
      <path d="M2.75 18.5c.7-3 2.8-4.5 5.25-4.5s4.55 1.5 5.25 4.5" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="15.5" cy="9" r="2.5" strokeWidth="1.75" />
      <path d="M16.5 14.2c1.6.5 2.6 1.7 3 3.3" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  // La llave siguió al nombre de la pestaña (dinero → recursos); el ícono
  // del entregable no cambia.
  recursos: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8.25" strokeWidth="1.75" />
      <path
        d="M13.6 8.4c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.9 1-2.9 2.2 0 3 5.8 1.4 5.8 4.4 0 1.2-1.3 2.2-2.9 2.2-1.2 0-2.2-.6-2.7-1.5M11 5.5v11"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  mas: (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="5" cy="11" r="1.6" fill="currentColor" />
      <circle cx="11" cy="11" r="1.6" fill="currentColor" />
      <circle cx="17" cy="11" r="1.6" fill="currentColor" />
    </svg>
  ),
};
