"use client";

// Lista de respuestas de una experiencia con filtro por estrellas generales
// (Todas / 5★ / 4★ / ≤3★) y orden por fecha (reciente primero, ya viene así).
import { useState } from "react";
import type { EncuestaRespuesta } from "@/lib/admin/queries";

type Filtro = "todas" | 5 | 4 | 3;

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: 5, label: "5★" },
  { key: 4, label: "4★" },
  { key: 3, label: "≤3★" },
];

function Stars({ v }: { v: number | null }) {
  if (v == null) return <span className="mut">—</span>;
  const n = Math.round(v);
  return (
    <span style={{ color: "var(--orange)", letterSpacing: 1 }}>
      {"★".repeat(Math.min(5, n))}
      <span style={{ color: "var(--line)" }}>{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

export default function RespuestasExp({ respuestas }: { respuestas: EncuestaRespuesta[] }) {
  const [f, setF] = useState<Filtro>("todas");
  const cuenta = (k: Filtro) => (k === "todas" ? respuestas.length : respuestas.filter((r) => r.bucket === k).length);
  const lista = f === "todas" ? respuestas : respuestas.filter((r) => r.bucket === f);

  if (!respuestas.length) return <div className="empty">Aún sin respuestas.</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTROS.map((opt) => {
          const on = f === opt.key;
          const n = cuenta(opt.key);
          return (
            <button
              key={String(opt.key)}
              type="button"
              onClick={() => setF(opt.key)}
              disabled={n === 0 && opt.key !== "todas"}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "5px 13px",
                fontSize: 13,
                fontWeight: 600,
                cursor: n === 0 && opt.key !== "todas" ? "not-allowed" : "pointer",
                background: on ? "var(--forest)" : "#fff",
                color: on ? "#fff" : n === 0 && opt.key !== "todas" ? "var(--line)" : "var(--charcoal)",
                opacity: n === 0 && opt.key !== "todas" ? 0.55 : 1,
                transition: "all .15s",
              }}
            >
              {opt.label} <span style={{ opacity: 0.7, fontWeight: 500 }}>({n})</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {lista.map((r, i) => (
          <div
            key={i}
            className="card pad"
            style={{ padding: "13px 16px", borderLeft: `3px solid ${r.bucket >= 5 ? "var(--olive)" : r.bucket >= 4 ? "var(--sand)" : "var(--orange)"}` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="av" style={{ flex: "0 0 auto" }}>{r.iniciales}</span>
              <b style={{ fontSize: 13.5 }}>{r.nombre}</b>
              <Stars v={r.stars} />
              {r.nps != null ? <span className="mut" style={{ fontSize: 12 }}>NPS {r.nps}</span> : null}
              <span className="mut" style={{ fontSize: 12, marginLeft: "auto" }}>{r.fecha}</span>
            </div>
            {r.textos.length ? (
              <div style={{ marginTop: 8, display: "grid", gap: 5 }}>
                {r.textos.map((t, j) => (
                  <div key={j} style={{ fontSize: 13.5, color: "var(--charcoal)", lineHeight: 1.5 }}>“{t}”</div>
                ))}
              </div>
            ) : (
              <div className="mut" style={{ fontSize: 12.5, marginTop: 5 }}>Sin comentarios abiertos.</div>
            )}
          </div>
        ))}
        {!lista.length ? <div className="empty">Nada con ese filtro.</div> : null}
      </div>
    </div>
  );
}
