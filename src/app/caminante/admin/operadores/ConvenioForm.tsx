"use client";

// Convenio y datos fiscales — la parte administrativa del alta de un operador.
//
// Va en tarjeta aparte del perfil público a propósito: el perfil es lo que ve
// el viajero (foto, bio, equipo) y esto es lo que se necesita para cobrar y
// facturar. Se editan en momentos distintos y por razones distintas.

import { useState } from "react";
import { saveOperatorConvenio, type OperadorLegal } from "@/lib/operators/convenio-actions";

export default function ConvenioForm({
  id,
  nombre,
  commissionPct,
  legal,
  rfcActual,
  razonSocialActual,
}: {
  id: string;
  nombre: string;
  commissionPct: number | null;
  legal: OperadorLegal | null;
  // ⚠️ Llegan por separado de `legal` desde la 0038: el RFC y la razón social
  // son del EMISOR del CFDI y viven en columnas planas. La pantalla no cambia —
  // se siguen capturando aquí— pero ya no tienen dos casas donde divergir.
  rfcActual: string;
  razonSocialActual: string;
}) {
  const [pct, setPct] = useState(commissionPct == null ? "" : String(commissionPct));
  const [razonSocial, setRazonSocial] = useState(razonSocialActual);
  const [rfc, setRfc] = useState(rfcActual);
  const [domicilio, setDomicilio] = useState(legal?.domicilio ?? "");
  const [responsable, setResponsable] = useState(legal?.responsable ?? "");
  const [guardando, setGuardando] = useState(false);
  const [estado, setEstado] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setEstado("");
    const fd = new FormData();
    fd.set("id", id);
    fd.set("commissionPct", pct.trim());
    fd.set("razonSocial", razonSocial);
    fd.set("rfc", rfc);
    fd.set("domicilio", domicilio);
    fd.set("responsable", responsable);
    const r = await saveOperatorConvenio(fd);
    setGuardando(false);
    setEstado(r.ok ? "✓ Guardado" : `Error: ${r.error}`);
  }

  return (
    <form onSubmit={guardar} className="card pad" style={{ marginBottom: 24 }}>
      <span className="subtitle" style={{ margin: 0 }}>
        Convenio y datos fiscales · {nombre}
      </span>
      <p className="mut" style={{ fontSize: 12.5, margin: "4px 0 0" }}>
        Lo que hace falta para cobrarle y facturarle. El perfil público (foto, bio, equipo) se edita
        abajo.
      </p>

      <div
        className="mini-form"
        // ⚠️ `alignItems:"start"` es obligatorio: `.adm .mini-form` trae
        // `align-items:center` (pensado para una fila de controles sueltos), y
        // aquí centraba cada label dentro de su celda. Como el hint de
        // «Comisión» hace esa celda más alta, los otros tres rótulos quedaban
        // flotando a media altura y la tarjeta se veía descuadrada.
        style={{
          display: "grid",
          alignItems: "start",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))",
        }}
      >
        <label style={lbl}>
          <span>Comisión de plataforma (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            style={inp}
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="10"
          />
          {/* La distinción vacío/cero decide si el panel propone un depósito. */}
          <small className="mut" style={hint}>
            Lo que retiene Caminante por venta. <b>Vacío = por definir</b> (el panel no calcula neto).
            0 = no se cobra comisión. Se congela en cada venta: cambiarlo no toca las pasadas.
          </small>
        </label>

        <label style={lbl}>
          <span>Razón social</span>
          <input
            style={inp}
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            placeholder="Kéntro Hospitalidad, S.A. de C.V."
          />
        </label>

        <label style={lbl}>
          <span>RFC</span>
          <input
            style={inp}
            value={rfc}
            onChange={(e) => setRfc(e.target.value.toUpperCase())}
            placeholder="KHO230512AB1"
            maxLength={13}
          />
          <small className="mut" style={hint}>
            Déjalo vacío si aún no lo tienes. A medias se factura mal.
          </small>
        </label>

        <label style={lbl}>
          <span>Responsable</span>
          <input
            style={inp}
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Quién firma el convenio"
          />
        </label>

        <label style={{ ...lbl, gridColumn: "1 / -1" }}>
          <span>Domicilio fiscal</span>
          <input
            style={inp}
            value={domicilio}
            onChange={(e) => setDomicilio(e.target.value)}
            placeholder="Calle, número, colonia, municipio, estado, C.P."
          />
        </label>
      </div>

      <div className="act-row">
        <button type="submit" className="btn btn-orange btn-sm" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar convenio"}
        </button>
        {estado ? (
          <span className="mut" style={{ fontSize: 12.5, alignSelf: "center" }}>
            {estado}
          </span>
        ) : null}
      </div>
    </form>
  );
}

// ⚠️ `alignContent:start`. Sin eso el grid reparte el alto de la fila entre las
// filas internas de cada label, y como el hint de «Comisión» es largo, la fila
// crece y los demás campos bajan con ella: los rótulos quedan a cuatro alturas
// distintas y la tarjeta se ve descuadrada. Arriba todos, y los hints cuelgan.
const lbl: React.CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: 5,
  fontSize: 12,
  color: "var(--ink-soft)",
};
const inp: React.CSSProperties = { width: "100%" };
const hint: React.CSSProperties = { fontSize: 11.5, lineHeight: 1.45 };
