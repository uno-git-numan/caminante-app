"use client";

// Captura de una venta pagada por TRANSFERENCIA.
//
// Antes de esto había tres puertas para que naciera una reserva (checkout web,
// link de cobro, deslinde) y ninguna servía si el cliente depositaba a la
// cuenta. Esa venta no existía: ni contacto, ni reserva, ni ingreso, ni
// deslinde firmado.
//
// El comprobante se sube ANTES de guardar y a un bucket privado; lo que viaja
// al servidor es su ruta, nunca una URL pública.

import { useMemo, useState } from "react";
import {
  registrarTransferencia,
  type ExperienciaConSalidas,
  type TransferenciaResult,
} from "@/lib/admin/transferencias";

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function TransferenciaForm({ experiencias }: { experiencias: ExperienciaConSalidas[] }) {
  const [slug, setSlug] = useState("");
  const [slotId, setSlotId] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [personas, setPersonas] = useState("1");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");

  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<TransferenciaResult | null>(null);

  const exp = useMemo(() => experiencias.find((e) => e.slug === slug), [experiencias, slug]);
  const salida = exp?.salidas.find((s) => s.id === slotId);

  // Sugerencia de monto, no imposición: el precio de lista casi nunca es lo que
  // se transfirió (descuentos, anticipos, grupos).
  const sugerido = salida?.precio ? salida.precio * (parseInt(personas, 10) || 1) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRes(null);

    let comprobantePath: string | undefined;
    if (archivo) {
      setSubiendo(true);
      try {
        const fd = new FormData();
        fd.append("file", archivo);
        const r = await fetch("/caminante/api/admin/comprobante", { method: "POST", body: fd });
        const j = (await r.json()) as { path?: string; error?: string };
        if (!r.ok || !j.path) throw new Error(j.error || "No se pudo subir el comprobante.");
        comprobantePath = j.path;
      } catch (err) {
        setSubiendo(false);
        setError((err as Error).message);
        return;
      }
      setSubiendo(false);
    }

    setGuardando(true);
    try {
      const out = await registrarTransferencia({
        slug,
        slotId,
        email: email.trim(),
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        personas: parseInt(personas, 10) || 1,
        montoMxn: Number(monto),
        fecha,
        referencia: referencia.trim() || undefined,
        comprobantePath,
        notas: notas.trim() || undefined,
      });
      setRes(out);
      if (out.ok) {
        setNombre("");
        setEmail("");
        setTelefono("");
        setMonto("");
        setReferencia("");
        setNotas("");
        setArchivo(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  const ocupado = subiendo || guardando;

  return (
    <form onSubmit={onSubmit}>
      <div
        className="mini-form"
        style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      >
        <label style={lbl}>
          Experiencia
          <select
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlotId("");
            }}
            required
          >
            <option value="">Elige…</option>
            {experiencias.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={lbl}>
          Salida
          <select value={slotId} onChange={(e) => setSlotId(e.target.value)} required disabled={!exp}>
            <option value="">{exp ? "Elige…" : "Primero la experiencia"}</option>
            {(exp?.salidas || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label style={lbl}>
          Nombre de quien pagó
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Lorena Saravia" required />
        </label>

        <label style={lbl}>
          Correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@correo.com"
            required
          />
        </label>

        <label style={lbl}>
          WhatsApp <span style={op}>opcional</span>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="55 1234 5678" />
        </label>

        <label style={lbl}>
          Personas
          <input type="number" min={1} value={personas} onChange={(e) => setPersonas(e.target.value)} required />
        </label>

        <label style={lbl}>
          Monto transferido (MXN)
          <input
            type="number"
            min={1}
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder={sugerido ? String(sugerido) : "16500"}
            required
          />
        </label>

        <label style={lbl}>
          Fecha del movimiento
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>

        <label style={lbl}>
          Referencia del banco
          <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="1765798" />
        </label>

        <label style={lbl}>
          Comprobante <span style={op}>imagen o PDF</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          />
        </label>

        <label style={{ ...lbl, gridColumn: "1 / -1" }}>
          Nota <span style={op}>opcional — p. ej. el nivel contratado o el grupo</span>
          <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Nivel: Habitación sencilla" />
        </label>
      </div>

      {sugerido && Number(monto) && Math.abs(Number(monto) - sugerido) > 1 ? (
        <p className="mut" style={{ fontSize: 12, marginTop: 8 }}>
          El precio de lista para {personas} {Number(personas) === 1 ? "persona" : "personas"} sería{" "}
          {sugerido.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}. Se guarda lo que
          escribiste — si hubo descuento o anticipo, está bien que no cuadre.
        </p>
      ) : null}

      <div className="act-row">
        <button type="submit" className="btn btn-dark btn-sm" disabled={ocupado}>
          {subiendo ? "Subiendo comprobante…" : guardando ? "Registrando…" : "Registrar transferencia"}
        </button>
        <span className="mut" style={{ fontSize: 12, alignSelf: "center" }}>
          Al registrarla se le manda el correo de confirmación con su deslinde.
        </span>
      </div>

      {error ? (
        <p style={{ color: "var(--orange)", fontSize: 13, marginTop: 10 }}>{error}</p>
      ) : null}

      {res && !res.ok ? (
        <p style={{ color: "var(--orange)", fontSize: 13, marginTop: 10 }}>{res.error}</p>
      ) : null}

      {res && res.ok ? (
        <div className="card pad" style={{ marginTop: 12 }}>
          <b style={{ fontSize: 13 }}>Listo. La venta ya existe en el sistema.</b>
          <p className="mut" style={{ fontSize: 12.5, margin: "6px 0 0" }}>
            {res.correoEnviado
              ? "Le llegó el correo de confirmación."
              : "⚠️ El correo de confirmación NO salió — mándale tú el link del deslinde."}
          </p>
          {res.deslindeUrl ? (
            <p style={{ fontSize: 12.5, margin: "6px 0 0", wordBreak: "break-all" }}>
              Deslinde: <a href={res.deslindeUrl}>{res.deslindeUrl}</a>
            </p>
          ) : (
            <p style={{ fontSize: 12.5, margin: "6px 0 0", color: "var(--orange)" }}>
              Esta experiencia no tiene deslinde activo, así que no hay nada que firmar. Actívalo
              antes de que viaje.
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}

const lbl: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  color: "var(--ink-soft)",
};
const op: React.CSSProperties = { opacity: 0.6 };
