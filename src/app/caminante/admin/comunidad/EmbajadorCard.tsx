"use client";

// Tarjeta de una aplicación de EMBAJADOR pendiente (patrón AccesoCard):
// datos completos de la aplicación + Aprobar / Rechazar con confirmación.
import { useState } from "react";
import { approveEmbajador, rejectEmbajador } from "@/lib/admin/embajadores-actions";

const PERFIL_LABEL: Record<string, string> = {
  creador: "Creador",
  agencia: "Agencia individual",
  comunidad: "Líder de comunidad",
};

export type EmbAppView = {
  id: string;
  nombre: string;
  email: string;
  whatsapp: string | null;
  perfil: string;
  links: string;
  experiencia: string | null;
  porque: string | null;
  conociste: string | null;
  fecha: string;
};

export default function EmbajadorCard({ app }: { app: EmbAppView }) {
  const [busy, setBusy] = useState<"ok" | "no" | null>(null);
  const [done, setDone] = useState<"ok" | "no" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function decidir(kind: "ok" | "no") {
    if (kind === "no" && !confirm(`¿Rechazar la aplicación de ${app.nombre}? Le mandamos un correo amable de "por ahora no".`)) return;
    setBusy(kind);
    setErr(null);
    try {
      const r = kind === "ok" ? await approveEmbajador(app.id) : await rejectEmbajador(app.id);
      if (r.ok) setDone(kind);
      else setErr(r.error || "No se pudo.");
    } catch {
      setErr("No se pudo. Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 15.5 }}>{app.nombre}</span>
        <span className="chip c-sol">{PERFIL_LABEL[app.perfil] ?? app.perfil}</span>
        <span className="mut" style={{ fontSize: 12.5, marginLeft: "auto" }}>{app.fecha}</span>
      </div>

      <div className="dl" style={{ marginTop: 12, gridTemplateColumns: "auto 1fr" }}>
        <dt>Correo</dt>
        <dd style={{ textAlign: "left" }}>{app.email}</dd>
        <dt>WhatsApp</dt>
        <dd style={{ textAlign: "left" }}>{app.whatsapp || "—"}</dd>
        <dt>Redes / audiencia</dt>
        <dd style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>{app.links}</dd>
        {app.experiencia ? (
          <>
            <dt>Experiencia</dt>
            <dd style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>{app.experiencia}</dd>
          </>
        ) : null}
        {app.porque ? (
          <>
            <dt>Por qué caminante</dt>
            <dd style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>{app.porque}</dd>
          </>
        ) : null}
        {app.conociste ? (
          <>
            <dt>Nos conoció por</dt>
            <dd style={{ textAlign: "left" }}>{app.conociste}</dd>
          </>
        ) : null}
      </div>

      <div className="act-row">
        {done === "ok" ? (
          <span className="chip c-paid">Aprobado — ya es embajador (correo de bienvenida enviado)</span>
        ) : done === "no" ? (
          <span className="chip c-canc">Rechazado (correo enviado)</span>
        ) : (
          <>
            <button className="btn btn-orange btn-sm" disabled={busy !== null} onClick={() => decidir("ok")}>
              {busy === "ok" ? "Aprobando…" : "Aprobar embajador"}
            </button>
            <button className="btn btn-danger btn-sm" disabled={busy !== null} onClick={() => decidir("no")}>
              {busy === "no" ? "Rechazando…" : "Rechazar"}
            </button>
          </>
        )}
        {err ? <span className="mut" style={{ color: "#b0341a", fontSize: 12.5 }}>{err}</span> : null}
      </div>
    </div>
  );
}
