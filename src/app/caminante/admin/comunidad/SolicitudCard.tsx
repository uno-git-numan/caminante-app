"use client";

// Tarjeta de una solicitud NUEVA: detalle + form de aprobación (prellenado con
// lo que pidió el cliente) + rechazar. Al aprobar muestra el link del grupo y
// el mensaje de WhatsApp con botones de copiar (patrón CobroForm).

import { useState } from "react";
import {
  approveSlotRequest,
  rejectSlotRequest,
  type AprobarResult,
} from "@/lib/admin/solicitudes-actions";

export type SolicitudView = {
  id: string;
  cliente: string;
  email: string;
  whatsapp: string;
  experiencia: string;
  slug: string;
  desiredDate: string | null; // "YYYY-MM-DD"
  nota: string | null;
  personas: number;
  groupType: "private" | "open";
  createdAt: string; // ya formateada
};

// "2026-12-05" → "Dic 5" (mismo estilo de etiqueta que el form: "Ago 28-30").
function labelDesdeFecha(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  const mes = d.toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" }).replace(".", "");
  const dia = d.toLocaleDateString("es-MX", { day: "numeric", timeZone: "UTC" });
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${dia}`;
}

export default function SolicitudCard({ s }: { s: SolicitudView }) {
  const [label, setLabel] = useState(s.desiredDate ? labelDesdeFecha(s.desiredDate) : "");
  const [start, setStart] = useState(s.desiredDate ?? "");
  const [end, setEnd] = useState("");
  const [cupo, setCupo] = useState(String(s.personas));
  const [precio, setPrecio] = useState("");
  const [vis, setVis] = useState<"public" | "private">(s.groupType === "open" ? "public" : "private");
  const [busy, setBusy] = useState<"aprobar" | "rechazar" | null>(null);
  const [res, setRes] = useState<AprobarResult | null>(null);
  const [rechazada, setRechazada] = useState(false);
  const [copied, setCopied] = useState<"link" | "msg" | null>(null);

  async function aprobar() {
    setBusy("aprobar");
    try {
      const r = await approveSlotRequest({
        requestId: s.id,
        label: label.trim(),
        startsAt: start,
        endsAt: end || null,
        capacity: cupo.trim() ? Math.max(1, parseInt(cupo, 10) || 1) : null,
        priceMxn: precio.trim() ? Number(precio.replace(/[^\d.]/g, "")) || null : null,
        visibility: vis,
      });
      setRes(r);
    } catch (e) {
      setRes({ ok: false, error: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function rechazar() {
    if (!confirm(`¿Rechazar la solicitud de ${s.cliente}? No se crea ninguna salida.`)) return;
    setBusy("rechazar");
    try {
      const r = await rejectSlotRequest(s.id);
      if (r.ok) setRechazada(true);
      else setRes({ ok: false, error: r.error || "No se pudo rechazar." });
    } finally {
      setBusy(null);
    }
  }

  async function copy(text: string, which: "link" | "msg") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  if (rechazada) {
    return (
      <div className="card" style={{ padding: 18, opacity: 0.7 }}>
        <span className="chip c-canc">Rechazada</span>{" "}
        <span className="mut" style={{ fontSize: 13.5 }}>
          {s.cliente} · {s.experiencia}
        </span>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16.5, fontWeight: 600 }}>
            {s.cliente} <span className="mut" style={{ fontWeight: 400 }}>quiere {s.experiencia}</span>
          </div>
          <div className="mut" style={{ fontSize: 13, marginTop: 3 }}>
            {s.desiredDate ? `Fecha deseada: ${s.desiredDate}` : "Fechas flexibles"} · {s.personas} persona(s) ·{" "}
            <span className="chip" style={{ fontSize: 11 }}>
              {s.groupType === "private" ? "Grupo privado" : "Salida abierta"}
            </span>{" "}
            · {s.createdAt}
          </div>
          <div className="mut" style={{ fontSize: 13, marginTop: 3 }}>
            {s.email} · {s.whatsapp}
          </div>
          {s.nota ? (
            <div style={{ fontSize: 13.5, marginTop: 6, fontStyle: "italic" }}>“{s.nota}”</div>
          ) : null}
        </div>
      </div>

      {res?.ok ? (
        <div style={{ marginTop: 16, border: "1px solid rgba(99,113,84,.35)", background: "rgba(99,113,84,.07)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            ✓ Salida creada{res.visibility === "private" ? " (privada)" : " (abierta, ya visible en la web)"}
            {res.yaAprobada ? " — ya estaba aprobada, este es su link" : ""}
          </div>
          <div style={{ fontSize: 13, wordBreak: "break-all", marginBottom: 10 }}>{res.link}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-orange btn-sm" onClick={() => copy(res.waMessage, "msg")}>
              {copied === "msg" ? "✓ Copiado" : "Copiar mensaje WhatsApp"}
            </button>
            <button type="button" className="btn btn-glass btn-sm" onClick={() => copy(res.link, "link")}>
              {copied === "link" ? "✓ Copiado" : "Copiar solo el link"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {res && !res.ok ? (
            <div style={{ marginTop: 12, color: "#b33517", fontSize: 13.5 }}>⚠️ {res.error}</div>
          ) : null}
          <div className="mini-form" style={{ marginTop: 16, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
            <label style={{ fontSize: 12 }}>
              Etiqueta
              <input type="text" value={label} placeholder="Dic 5-7" onChange={(e) => setLabel(e.target.value)} />
            </label>
            <label style={{ fontSize: 12 }}>
              Inicia
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label style={{ fontSize: 12 }}>
              Termina (encuesta +24h)
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
            <label style={{ fontSize: 12 }}>
              Cupo
              <input type="number" value={cupo} placeholder="sin tope" onChange={(e) => setCupo(e.target.value)} />
            </label>
            <label style={{ fontSize: 12 }}>
              Precio/persona
              <input type="number" value={precio} placeholder="base" onChange={(e) => setPrecio(e.target.value)} />
            </label>
            <label style={{ fontSize: 12 }}>
              Visibilidad
              <select value={vis} onChange={(e) => setVis(e.target.value as "public" | "private")}>
                <option value="private">Privada (link de grupo)</option>
                <option value="public">Abierta (pública en la web)</option>
              </select>
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-orange btn-sm" disabled={busy !== null} onClick={aprobar}>
              {busy === "aprobar" ? "Creando salida…" : "Aprobar y crear salida"}
            </button>
            <button type="button" className="btn btn-danger btn-sm" disabled={busy !== null} onClick={rechazar}>
              {busy === "rechazar" ? "Rechazando…" : "Rechazar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
