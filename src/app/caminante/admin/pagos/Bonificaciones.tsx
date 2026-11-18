"use client";

// BONIFICACIONES POR PAGAR (D23 de legal, §5).
//
// Cuando una salida se cancela por causa de quien opera, a cada persona pagada
// se le debe el 20 % de lo que pagó además de su devolución. El sistema lo
// calcula y lo avisa; la transferencia la hace Luis desde su banco y aquí sólo
// se captura lo que prueba que se hizo. La cuenta completa del cliente no se
// pide ni se guarda: fecha, importe, últimos 4 dígitos y clave de rastreo.
//
// Sólo aparece si hay algo que enseñar: una pantalla de pagos sin
// bonificaciones no necesita un bloque vacío.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BonificacionPagada, BonificacionPorPagar } from "@/lib/cancelacion/bonificaciones";
import { registrarPagoBonificacion } from "@/lib/cancelacion/bonificaciones-actions";

const mxn = (n: number) => "$" + n.toLocaleString("es-MX", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const dia = (ymd: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${ymd}T12:00:00Z`));

function PorPagar({ b }: { b: BonificacionPorPagar }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [f, setF] = useState({ fecha: "", monto: String(b.monto), ultimos4: "", clave: "" });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{b.nombre}</span>
        <span className="mut" style={{ fontSize: 12.5 }}>
          {b.experiencia}
          {b.salida ? ` · ${b.salida}` : ""}
        </span>
        <span style={{ fontSize: 14 }}>
          <b>{mxn(b.monto)}</b> <span className="mut" style={{ fontSize: 12.5 }}>(20 % de {mxn(b.pagado)})</span>
        </span>
        <span style={{ fontSize: 12.5, color: b.vencida ? "#b33517" : undefined }} className={b.vencida ? undefined : "mut"}>
          {b.vencida ? "Venció el" : "A más tardar el"} {dia(b.venceEl)}
        </span>
        <span className="mut" style={{ fontSize: 12.5 }}>
          {b.operadora ? `Se recupera de ${b.operadora}` : "Costo de la casa"}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAbierta((v) => !v)}>
          {abierta ? "Cerrar" : "Ya la transferí"}
        </button>
      </div>
      {abierta ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 10 }}>
          <label className="mut" style={{ fontSize: 12.5 }}>
            Fecha de la transferencia
            <br />
            <input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
          </label>
          <label className="mut" style={{ fontSize: 12.5 }}>
            Importe
            <br />
            <input
              inputMode="decimal"
              value={f.monto}
              onChange={(e) => setF({ ...f, monto: e.target.value.replace(/[^0-9.]/g, "") })}
              style={{ width: 110 }}
            />
          </label>
          <label className="mut" style={{ fontSize: 12.5 }}>
            Últimos 4 dígitos de la cuenta
            <br />
            <input
              inputMode="numeric"
              maxLength={4}
              value={f.ultimos4}
              onChange={(e) => setF({ ...f, ultimos4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              style={{ width: 90 }}
            />
          </label>
          <label className="mut" style={{ fontSize: 12.5 }}>
            Clave de rastreo
            <br />
            <input value={f.clave} onChange={(e) => setF({ ...f, clave: e.target.value })} style={{ width: "min(260px, 100%)" }} />
          </label>
          <button
            type="button"
            className="btn btn-orange btn-sm"
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              setError("");
              const r = await registrarPagoBonificacion(b.id, {
                fecha: f.fecha,
                monto: Number(f.monto),
                ultimos4: f.ultimos4,
                claveRastreo: f.clave,
              });
              setOcupado(false);
              if (!r.ok) { setError(r.error); return; }
              setAbierta(false);
              router.refresh();
            }}
          >
            {ocupado ? "Guardando…" : "Registrar el pago"}
          </button>
          {error ? <span style={{ fontSize: 12.5, color: "#b33517", flexBasis: "100%" }}>{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function Bonificaciones({ porPagar, pagadas }: { porPagar: BonificacionPorPagar[]; pagadas: BonificacionPagada[] }) {
  if (!porPagar.length && !pagadas.length) return null;
  const total = porPagar.reduce((n, b) => n + b.monto, 0);
  return (
    <div className="card pad" style={{ marginBottom: 18, borderColor: porPagar.length ? "rgba(179,53,23,.3)" : undefined }}>
      <span className="subtitle">Bonificaciones</span>
      {porPagar.length ? (
        <>
          <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
            {porPagar.length === 1 ? "Hay 1 bonificación" : `Hay ${porPagar.length} bonificaciones`} por pagar ({mxn(total)}): el 20 % que se
            le debe a cada persona cuando una salida se cancela por causa de quien opera. Se paga por{" "}
            <b>transferencia</b> a la cuenta que la persona indique al contestar el correo de la cancelación. Aquí no se
            guarda su cuenta: sólo la fecha, el importe, los últimos 4 dígitos y la clave de rastreo.
          </p>
          <div style={{ marginTop: 8 }}>
            {porPagar.map((b) => (
              <PorPagar key={b.id} b={b} />
            ))}
          </div>
        </>
      ) : (
        <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>No hay bonificaciones por pagar.</p>
      )}
      {pagadas.length ? (
        <details style={{ marginTop: 12 }}>
          <summary className="mut" style={{ fontSize: 12.5, cursor: "pointer" }}>
            Pagadas ({pagadas.length})
          </summary>
          {pagadas.map((b) => (
            <div key={b.id} className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
              <b>{b.nombre}</b> · {b.experiencia}
              {b.salida ? ` · ${b.salida}` : ""} · {mxn(b.pagadoReal)} el {dia(b.pagadaEl)} · cuenta ···{b.ultimos4} · rastreo {b.claveRastreo}
              {b.operadora ? ` · se recupera de ${b.operadora}` : " · costo de la casa"}
            </div>
          ))}
        </details>
      ) : null}
    </div>
  );
}
