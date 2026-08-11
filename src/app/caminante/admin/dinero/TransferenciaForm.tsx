"use client";

// Captura de un pago hecho FUERA de Stripe: transferencia o efectivo.
//
// El flujo lo definió Luis (11 ago): el admin captura con lo poco que sabe
// —evento, nombre, lugares, comprobante— y el sistema devuelve un **enlace**
// para mandarle a la persona, donde ella se da de alta y firma el deslinde
// como cualquier otro cliente. Por eso el correo NO es obligatorio: basta el
// WhatsApp, que es por donde va a llegar el link.
//
// El monto se calcula solo (precio de la salida × lugares) pero queda editable:
// casi nunca coincide con la lista (descuentos, anticipos, grupos), y el número
// que manda es el que de verdad entró a la cuenta.
//
// El comprobante se sube ANTES de guardar y a un bucket privado; al servidor
// viaja su ruta, nunca una URL.

import { useMemo, useState } from "react";
import {
  registrarPagoManual,
  type ExperienciaConSalidas,
  type MetodoManual,
  type TransferenciaResult,
} from "@/lib/admin/transferencias";

const hoyISO = () => new Date().toISOString().slice(0, 10);
const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export default function TransferenciaForm({ experiencias }: { experiencias: ExperienciaConSalidas[] }) {
  const [metodo, setMetodo] = useState<MetodoManual>("transfer");
  const [slug, setSlug] = useState("");
  const [slotId, setSlotId] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [personas, setPersonas] = useState("1");
  // El monto es DERIVADO del precio × lugares mientras nadie lo escriba a mano.
  // Se modela como "override" en vez de sincronizar con un efecto: así no hay
  // un render intermedio con la cifra vieja.
  const [montoManual, setMontoManual] = useState<string | null>(null);
  const [fecha, setFecha] = useState(hoyISO());
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");

  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<TransferenciaResult | null>(null);
  const [copiado, setCopiado] = useState<"link" | "msg" | null>(null);

  const exp = useMemo(() => experiencias.find((e) => e.slug === slug), [experiencias, slug]);
  const salida = exp?.salidas.find((s) => s.id === slotId);
  const nPersonas = Math.max(1, parseInt(personas, 10) || 1);
  const sugerido = salida?.precio ? salida.precio * nPersonas : null;

  const monto = montoManual ?? (sugerido ? String(sugerido) : "");

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
      const out = await registrarPagoManual({
        slug,
        slotId,
        metodo,
        nombre: nombre.trim(),
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        personas: nPersonas,
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
        setReferencia("");
        setNotas("");
        setArchivo(null);
        setMontoManual(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function copiar(texto: string, cual: "link" | "msg") {
    await navigator.clipboard.writeText(texto);
    setCopiado(cual);
    setTimeout(() => setCopiado(null), 1600);
  }

  const ocupado = subiendo || guardando;
  const esTransfer = metodo === "transfer";

  return (
    <form onSubmit={onSubmit}>
      <div className="act-row" style={{ marginTop: 12, marginBottom: 2 }}>
        {(["transfer", "cash"] as MetodoManual[]).map((m) => (
          <button
            key={m}
            type="button"
            className={"btn btn-sm " + (metodo === m ? "btn-dark" : "btn-glass")}
            onClick={() => setMetodo(m)}
          >
            {m === "transfer" ? "Transferencia" : "Efectivo"}
          </button>
        ))}
      </div>

      <div
        className="mini-form"
        style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      >
        <label style={lbl}>
          Experiencia
          <select
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlotId("");
              setMontoManual(null);
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
          <select
            value={slotId}
            onChange={(e) => {
              setSlotId(e.target.value);
              setMontoManual(null);
            }}
            required
            disabled={!exp}
          >
            <option value="">{exp ? "Elige…" : "Primero la experiencia"}</option>
            {(exp?.salidas || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
                {s.precio ? ` · ${money(s.precio)}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={lbl}>
          Nombre de quien pagó
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Lorena Saravia" required />
        </label>

        <label style={lbl}>
          Lugares
          <input
            type="number"
            min={1}
            value={personas}
            onChange={(e) => {
              setPersonas(e.target.value);
              setMontoManual(null);
            }}
            required
          />
        </label>

        <label style={lbl}>
          Monto (MXN)
          <input
            type="number"
            min={1}
            step="0.01"
            value={monto}
            onChange={(e) => {
              setMontoManual(e.target.value);
            }}
            placeholder="16500"
            required
          />
        </label>

        <label style={lbl}>
          Fecha del {esTransfer ? "movimiento" : "cobro"}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>

        <label style={lbl}>
          WhatsApp <span style={op}>por aquí le mandas el enlace</span>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="55 1234 5678" />
        </label>

        <label style={lbl}>
          Correo <span style={op}>si lo tienes, le llega solo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@correo.com" />
        </label>

        {esTransfer ? (
          <label style={lbl}>
            Referencia del banco
            <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="1765798" />
          </label>
        ) : null}

        <label style={lbl}>
          Comprobante <span style={op}>captura o archivo</span>
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

      {sugerido ? (
        <p className="mut" style={{ fontSize: 12, marginTop: 8 }}>
          Precio de lista: {money(salida!.precio!)} × {nPersonas} = <b>{money(sugerido)}</b>.
          {Number(monto) && Math.abs(Number(monto) - sugerido) > 1
            ? " Estás capturando otra cifra — bien, si hubo descuento o anticipo."
            : ""}
        </p>
      ) : slotId ? (
        <p className="mut" style={{ fontSize: 12, marginTop: 8 }}>
          Esa salida no tiene precio capturado, así que el monto va a mano.
        </p>
      ) : null}

      <div className="act-row">
        <button type="submit" className="btn btn-dark btn-sm" disabled={ocupado}>
          {subiendo ? "Subiendo comprobante…" : guardando ? "Registrando…" : "Registrar pago y generar enlace"}
        </button>
      </div>

      {error ? <p style={{ color: "var(--orange)", fontSize: 13, marginTop: 10 }}>{error}</p> : null}
      {res && !res.ok ? (
        <p style={{ color: "var(--orange)", fontSize: 13, marginTop: 10 }}>{res.error}</p>
      ) : null}

      {res && res.ok ? (
        <div className="card pad" style={{ marginTop: 12 }}>
          <b style={{ fontSize: 13 }}>Pago registrado. Falta que ella complete su alta.</b>
          {res.deslindeUrl ? (
            <>
              <p className="mut" style={{ fontSize: 12.5, margin: "6px 0 0" }}>
                {res.correoEnviado
                  ? "Le llegó el correo con el enlace. Si quieres, mándaselo también por WhatsApp:"
                  : "Mándale este enlace por WhatsApp — ahí captura sus datos y firma el deslinde:"}
              </p>
              <p style={{ fontSize: 12.5, margin: "8px 0 0", wordBreak: "break-all" }}>{res.deslindeUrl}</p>
              <div className="act-row">
                <button
                  type="button"
                  className="btn btn-glass btn-sm"
                  onClick={() => copiar(res.deslindeUrl!, "link")}
                >
                  {copiado === "link" ? "Copiado" : "Copiar enlace"}
                </button>
                <button
                  type="button"
                  className="btn btn-dark btn-sm"
                  onClick={() => copiar(res.mensaje, "msg")}
                >
                  {copiado === "msg" ? "Copiado" : "Copiar mensaje de WhatsApp"}
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 12.5, margin: "6px 0 0", color: "var(--orange)" }}>
              Esta experiencia no tiene el deslinde activo, así que no hay enlace que mandar y nadie
              puede firmar. Actívalo en el formulario de la experiencia antes de que viaje.
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}

const lbl: React.CSSProperties = { display: "grid", gap: 4, fontSize: 12, color: "var(--ink-soft)" };
const op: React.CSSProperties = { opacity: 0.6 };
