"use client";

// Tarjeta de una solicitud de acceso de operador (pendiente): aprobar / rechazar.
import { useState } from "react";
import { approveOperador, rejectOperador } from "@/lib/admin/accesos-actions";

export default function AccesoCard({ email, nombre }: { email: string; nombre: string }) {
  const [busy, setBusy] = useState<"ok" | "no" | null>(null);
  const [done, setDone] = useState<"aprobada" | "rechazada" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(kind: "ok" | "no") {
    if (kind === "no" && !confirm(`¿Rechazar el acceso de ${nombre || email}? Su cuenta queda como viajero.`)) return;
    setBusy(kind);
    setErr(null);
    const r = kind === "ok" ? await approveOperador(email) : await rejectOperador(email);
    setBusy(null);
    if (r.ok) setDone(kind === "ok" ? "aprobada" : "rechazada");
    else setErr(r.error || "No se pudo.");
  }

  if (done) {
    return (
      <div className="card" style={{ padding: 16, opacity: 0.75 }}>
        <span className={`chip ${done === "aprobada" ? "c-paid" : "c-canc"}`}>
          {done === "aprobada" ? "Aprobado ✓ — ya es operador" : "Rechazado"}
        </span>{" "}
        <span className="mut" style={{ fontSize: 13.5 }}>{nombre || email}</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 15.5, fontWeight: 600 }}>{nombre || "Sin nombre"}</div>
        <div className="mut" style={{ fontSize: 13, marginTop: 2 }}>{email}</div>
        {err ? <div style={{ color: "#b33517", fontSize: 13, marginTop: 6 }}>⚠️ {err}</div> : null}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn-orange btn-sm" disabled={busy !== null} onClick={() => run("ok")}>
          {busy === "ok" ? "Aprobando…" : "Aprobar operador"}
        </button>
        <button type="button" className="btn btn-danger btn-sm" disabled={busy !== null} onClick={() => run("no")}>
          {busy === "no" ? "…" : "Rechazar"}
        </button>
      </div>
    </div>
  );
}
