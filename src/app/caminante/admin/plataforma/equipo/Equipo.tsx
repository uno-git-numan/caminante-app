"use client";

// EL EQUIPO — dar de alta, prender y apagar facultades, dar de baja (0070).
//
// Una sola pantalla con dos modos: la CASA (todos, numan y cualquier
// operadora) y una OPERADORA (los suyos, sólo su operadora, sólo facultades de
// operadora). El servidor vuelve a decidir todo (`lib/equipo/actions.ts`); aquí
// sólo se ofrece lo que ese modo puede pedir. Sin lámina de Claude Design: es
// una lista y un formulario con las piezas del panel (card, mini-form, chip).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agregarAlEquipo, cambiarFacultades, darDeBaja } from "@/lib/equipo/actions";
import { FACULTAD, FACULTADES, FACULTADES_DE_OPERADORA, type Facultad } from "@/lib/equipo/facultades";
import type { MiembroEnPantalla } from "@/lib/equipo/lista";

type Modo = { casa: true; operadoras: { id: string; nombre: string }[] } | { casa: false; operatorId: string; nombre: string };

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });

export default function Equipo({ miembros, modo }: { miembros: MiembroEnPantalla[]; modo: Modo }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [numan, setNuman] = useState(false);
  const [ops, setOps] = useState<string[]>([]);
  const [fac, setFac] = useState<Facultad[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, arranca] = useTransition();
  const permitidas: Facultad[] = modo.casa ? [...FACULTADES] : FACULTADES_DE_OPERADORA;

  const toggle = <T,>(lista: T[], x: T) => (lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x]);

  const alta = () =>
    arranca(async () => {
      setAviso(null);
      const r = await agregarAlEquipo({ email, nombre, numan, operadoras: modo.casa ? ops : undefined, facultades: fac });
      if (!r.ok) return setAviso(r.error);
      setEmail(""); setNombre(""); setNuman(false); setOps([]); setFac([]);
      setAviso("Listo. Entra con ese correo, como siempre.");
      router.refresh();
    });

  const activos = miembros.filter((m) => m.activo);
  const bajas = miembros.filter((m) => !m.activo);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card pad">
        <span className="subtitle" style={{ margin: 0 }}>Dar de alta a alguien</span>
        <p className="mut" style={{ fontSize: 12.5, margin: "6px 0 10px", maxWidth: "70ch" }}>
          {modo.casa
            ? "Su correo es su llave: entra al panel con él y ve sólo lo que aquí le prendas. Nunca dinero, comisiones, cuentas de cobro ni dispensas."
            : `Trabaja para ${modo.nombre}: ve y hace lo que aquí le prendas, y nada más. Los cobros, las devoluciones y tu convenio no se le abren.`}
        </p>
        <div className="mini-form" style={{ alignItems: "start" }}>
          <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@numanhub.com" /></label>
          <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} /></label>
        </div>
        {modo.casa ? (
          <div style={{ marginTop: 12 }}>
            <p className="mut" style={{ fontSize: 12, margin: "0 0 6px" }}>Para quién trabaja</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12.5 }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={numan} onChange={(e) => setNuman(e.target.checked)} /> numan (la plataforma)
              </label>
              {modo.operadoras.map((o) => (
                <label key={o.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={ops.includes(o.id)} onChange={() => setOps(toggle(ops, o.id))} /> {o.nombre}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <p className="mut" style={{ fontSize: 12, margin: "0 0 6px" }}>Qué puede hacer</p>
          <div style={{ display: "grid", gap: 6 }}>
            {permitidas.map((f) => (
              <label key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5 }}>
                <input type="checkbox" checked={fac.includes(f)} onChange={() => setFac(toggle(fac, f))} style={{ marginTop: 3 }} />
                <span><b>{FACULTAD[f].nombre}</b> <span className="mut">· {FACULTAD[f].que}</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="salfoot" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-orange btn-sm" disabled={pendiente || !email || !nombre} onClick={alta}>
            {pendiente ? "Guardando…" : "Dar de alta"}
          </button>
          {aviso ? <span className="mut" style={{ fontSize: 12.5 }}>{aviso}</span> : null}
        </div>
      </div>

      <div>
        <span className="subtitle">En el equipo · {activos.length}</span>
        {activos.length === 0 ? <div className="empty">Todavía nadie.</div> : null}
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          {activos.map((m) => <Miembro key={m.id} m={m} permitidas={permitidas} casa={modo.casa} />)}
        </div>
      </div>

      {modo.casa && bajas.length ? (
        <details>
          <summary className="mut" style={{ fontSize: 12.5, cursor: "pointer" }}>Bajas · {bajas.length}</summary>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {bajas.map((m) => (
              <div key={m.id} className="card" style={{ padding: 12, opacity: 0.7, fontSize: 12.5 }}>
                <b>{m.nombre}</b> <span className="mut">{m.email} · baja {m.bajaAt ? fecha(m.bajaAt) : ""}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Miembro({ m, permitidas, casa }: { m: MiembroEnPantalla; permitidas: Facultad[]; casa: boolean }) {
  const router = useRouter();
  const [fac, setFac] = useState<Facultad[]>(m.facultades);
  const [numan, setNuman] = useState(m.numan);
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, arranca] = useTransition();
  const cambio = numan !== m.numan || fac.length !== m.facultades.length || fac.some((f) => !m.facultades.includes(f));

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
        <div>
          <b style={{ fontSize: 15 }}>{m.nombre}</b>{" "}
          <span className="mut" style={{ fontSize: 12.5 }}>{m.email} · desde {fecha(m.altaAt)}</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {m.numan ? <span className="chip c-paid"><span className="cd" />numan</span> : null}
          {m.operadoras.map((o) => <span key={o.id} className="chip c-full"><span className="cd" />{o.nombre}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10, fontSize: 12.5 }}>
        {casa ? (
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={numan} onChange={(e) => setNuman(e.target.checked)} /> numan
          </label>
        ) : null}
        {permitidas.map((f) => (
          <label key={f} style={{ display: "flex", gap: 6, alignItems: "center" }} title={FACULTAD[f].que}>
            <input type="checkbox" checked={fac.includes(f)} onChange={() => setFac(fac.includes(f) ? fac.filter((x) => x !== f) : [...fac, f])} />
            {FACULTAD[f].nombre}
          </label>
        ))}
      </div>
      <div className="salfoot" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!cambio || pendiente}
          onClick={() =>
            arranca(async () => {
              setAviso(null);
              const r = await cambiarFacultades(m.id, fac, casa ? numan : undefined);
              setAviso(r.ok ? "Guardado." : r.error);
              if (r.ok) router.refresh();
            })
          }
        >
          {pendiente ? "Guardando…" : "Guardar cambios"}
        </button>
        {!confirmar ? (
          <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => setConfirmar(true)}>
            {casa ? "Dar de baja" : "Quitar de mi equipo"}
          </button>
        ) : (
          <>
            <span className="mut" style={{ fontSize: 12.5 }}>
              {casa ? "Pierde el panel ahora mismo; lo que atribuyó hasta hoy sigue siendo suyo." : "Deja de ver lo tuyo ahora mismo."}
            </span>
            <button
              type="button"
              className="btn btn-orange btn-sm"
              disabled={pendiente}
              onClick={() =>
                arranca(async () => {
                  const r = await darDeBaja(m.id);
                  if (!r.ok) setAviso(r.error);
                  setConfirmar(false);
                  router.refresh();
                })
              }
            >
              Sí, {casa ? "darle de baja" : "quitarle"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmar(false)}>Cancelar</button>
          </>
        )}
        {aviso ? <span className="mut" style={{ fontSize: 12.5 }}>{aviso}</span> : null}
      </div>
    </div>
  );
}
