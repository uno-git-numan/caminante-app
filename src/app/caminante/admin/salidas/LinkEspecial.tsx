"use client";

// LINK DE PAGO ESPECIAL — dentro de la cápsula de UNA salida (Luis, 28 oct
// 2026): descuento en % o monto fijo para una persona concreta, con el porqué
// escrito. Mismo lenguaje visual que «Editar salida» (card pad · mini-form ·
// act-row) y los mismos chips de la cápsula para los links pendientes.

import { useState } from "react";
import type { LinkPendiente } from "@/lib/admin/salidas";
import { cancelarLinkEspecial, generarLinkEspecial } from "@/lib/payments/link-especial";
import { iniciales } from "@/lib/admin/formato";

const pesos = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function LinkEspecial({ slotId, precioLista, onListo }: { slotId: string; precioLista: number | null; onListo: () => void }) {
  const [f, setF] = useState({ nombre: "", email: "", telefono: "", lugares: "1", modo: "descuento" as "descuento" | "monto", valor: "", motivo: "" });
  const [error, setError] = useState("");
  const [generando, setGenerando] = useState(false);
  const [hecho, setHecho] = useState<{ url: string; montoMxn: number; listaMxn: number; waUrl: string | null; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const lugares = Math.max(1, parseInt(f.lugares, 10) || 1);
  const lista = precioLista != null ? precioLista * lugares : null;
  const valorN = Number(f.valor.replace(/[^0-9.]/g, ""));
  const vistaPrevia =
    lista != null && valorN > 0
      ? f.modo === "descuento"
        ? valorN < 100
          ? `Cobra ${pesos(lista * (1 - valorN / 100))} de ${pesos(lista)}`
          : "El descuento tiene que ser menor a 100%"
        : valorN <= lista
          ? `Cobra ${pesos(valorN)} de ${pesos(lista)} (${Math.round((1 - valorN / lista) * 100)}% menos)`
          : `Es más que el precio de lista (${pesos(lista)})`
      : null;

  const copiar = (t: string) => navigator.clipboard?.writeText(t).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); });

  if (hecho) {
    return (
      <div className="card pad" style={{ marginTop: 14 }}>
        <span className="subtitle">Link listo</span>
        <p style={{ fontSize: 13.5, marginTop: 8 }}>
          {f.nombre.trim()} paga <b>{pesos(hecho.montoMxn)}</b> por {lugares} {lugares === 1 ? "lugar" : "lugares"} (lista {pesos(hecho.listaMxn)}). El lugar se aparta cuando pague; entonces le llega el comprobante y el deslinde por correo.
        </p>
        <div className="salfoot">
          <div className="sallk">
            <span>{hecho.url.replace(/^https?:\/\//, "")}</span>
            <button type="button" className="btn btn-glass btn-sm" onClick={() => copiar(hecho.url)}>{copiado ? "Copiado" : "Copiar"}</button>
          </div>
          {hecho.waUrl ? (
            <a className="btn btn-ghost btn-sm" href={hecho.waUrl} target="_blank" rel="noopener">
              Mandar por WhatsApp
            </a>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copiar(hecho.texto)}>Copiar el mensaje</button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onListo}>Listo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card pad" style={{ marginTop: 14 }}>
      <span className="subtitle">Link de pago especial</span>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.55 }}>
        Para quien se le prometió otra cosa. El porqué queda escrito en la reserva; la comisión se calcula sobre lo cobrado.
      </p>
      <div className="mini-form">
        <label className="mut" style={{ fontSize: 12.5 }}>
          Nombre <input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} style={{ width: 170 }} />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Correo <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={{ width: 200 }} />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          WhatsApp <input inputMode="tel" value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} placeholder="opcional" style={{ width: 130 }} />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Lugares <input inputMode="numeric" value={f.lugares} onChange={(e) => setF({ ...f, lugares: e.target.value })} style={{ width: 60 }} />
        </label>
      </div>
      <div className="mini-form">
        <select value={f.modo} onChange={(e) => setF({ ...f, modo: e.target.value as "descuento" | "monto", valor: "" })} aria-label="Tipo">
          <option value="descuento">% de descuento</option>
          <option value="monto">Monto total a cobrar</option>
        </select>
        <input
          inputMode="decimal"
          value={f.valor}
          onChange={(e) => setF({ ...f, valor: e.target.value })}
          placeholder={f.modo === "descuento" ? "50" : lista != null ? `${Math.round(lista)}` : "2000"}
          aria-label={f.modo === "descuento" ? "Porcentaje" : "Monto"}
          style={{ width: 110 }}
        />
        <input value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} placeholder="Por qué: a cambio de fotos, acuerdo con…" aria-label="Motivo" style={{ flex: "1 1 220px" }} />
        {vistaPrevia ? <span className="mut" style={{ fontSize: 12.5 }}>{vistaPrevia}</span> : precioLista == null ? <span className="mut" style={{ fontSize: 12.5 }}>Esta salida no tiene precio de lista.</span> : null}
      </div>
      {error ? <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>{error}</p> : null}
      <div className="act-row">
        <button
          type="button"
          className="btn btn-orange"
          disabled={generando || !f.nombre.trim() || !f.email.includes("@") || !f.motivo.trim() || !(valorN > 0)}
          onClick={async () => {
            setGenerando(true);
            setError("");
            const r = await generarLinkEspecial({ slotId, nombre: f.nombre, email: f.email, telefono: f.telefono, lugares, modo: f.modo, valor: valorN, motivo: f.motivo });
            setGenerando(false);
            if (!r.ok) setError(r.error);
            else setHecho({ url: r.url, montoMxn: r.montoMxn, listaMxn: r.listaMxn, waUrl: r.waUrl, texto: r.texto });
          }}
        >
          {generando ? "Generando…" : "Generar link"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onListo}>Cancelar</button>
      </div>
    </div>
  );
}

/** Los links mandados y sin pagar de la salida: copiar otra vez, o cancelar. */
export function LinksPendientes({ links }: { links: LinkPendiente[] }) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [quitando, setQuitando] = useState<string | null>(null);
  if (!links.length) return null;
  const copiar = (id: string, t: string) => navigator.clipboard?.writeText(t).then(() => { setCopiado(id); setTimeout(() => setCopiado(null), 1500); });
  return (
    <>
      <div className="xh4">Links de pago sin pagar · {links.length}</div>
      {links.map((l) => (
        <div className="salper" key={l.reservationId}>
          <span className="av">{iniciales(l.nombre)}</span>
          <span className="nm">
            {l.nombre}
            <small>
              {pesos(l.montoMxn)} · {l.lugares} {l.lugares === 1 ? "lugar" : "lugares"}
              {l.nota ? ` · ${l.nota}` : ""}
            </small>
          </span>
          <span className="rt">
            <span className="st">Sin pagar</span>
            <button type="button" className="btn btn-glass btn-sm" style={{ padding: "3px 9px", fontSize: 11.5 }} onClick={() => copiar(l.reservationId, l.url)}>
              {copiado === l.reservationId ? "Copiado" : "Copiar link"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: "3px 9px", fontSize: 11.5 }}
              disabled={quitando === l.reservationId}
              onClick={async () => {
                setQuitando(l.reservationId);
                setError("");
                const r = await cancelarLinkEspecial(l.reservationId);
                setQuitando(null);
                if (!r.ok) setError(r.error);
              }}
            >
              Cancelar
            </button>
          </span>
        </div>
      ))}
      {error ? <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 8 }}>{error}</p> : null}
    </>
  );
}
