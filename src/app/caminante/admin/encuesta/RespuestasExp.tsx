"use client";

// Quién calificó qué, agrupado por salida y con filtro por estrellas
// (Todas / 5★ / 4★ / ≤3★). Reciente primero, ya viene ordenado así.
//
// ⚠️ Aquí NO van los textos: los comentarios viven en el plegable
// «Comentarios», agrupados por pregunta. Repetirlos en los dos lugares hacía
// que ninguno se leyera.
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

const promedio = (xs: EncuestaRespuesta[]): number | null => {
  const v = xs.map((x) => x.stars).filter((n): n is number => n != null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};

export default function RespuestasExp({ respuestas }: { respuestas: EncuestaRespuesta[] }) {
  const [f, setF] = useState<Filtro>("todas");
  const cuenta = (k: Filtro) => (k === "todas" ? respuestas.length : respuestas.filter((r) => r.bucket === k).length);
  const lista = f === "todas" ? respuestas : respuestas.filter((r) => r.bucket === f);

  // Agrupado por SALIDA: mezclar las salidas de una misma experiencia esconde
  // que una salió bien y otra mal — que es justo lo que hay que ver.
  const porSalida = Array.from(
    lista.reduce((m, r) => {
      const k = r.salidaLabel || "—";
      m.set(k, [...(m.get(k) ?? []), r]);
      return m;
    }, new Map<string, EncuestaRespuesta[]>()),
  );

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

      {porSalida.map(([salida, items]) => (
      <div key={salida} style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="sl">{"//"}</span>
          {salida === "—" ? "Salida sin identificar" : salida}
          <span className="mut" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: 0, textTransform: "none" }}>
            {items.length} {items.length === 1 ? "respuesta" : "respuestas"}
            {promedio(items) != null ? ` · ${promedio(items)}★` : ""}
          </span>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
        {items.map((r, i) => (
          <div
            key={i}
            className="card pad"
            style={{ padding: "13px 16px", borderLeft: `3px solid ${r.bucket >= 5 ? "var(--olive)" : r.bucket >= 4 ? "var(--sand)" : "var(--orange)"}` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="av" style={{ flex: "0 0 auto" }}>{r.iniciales}</span>
              <b style={{ fontSize: 13.5 }}>{r.nombre}</b>
              {r.via === "grupo" ? (
                <span className="mut" style={{ fontSize: 11, fontFamily: "var(--mono)", border: "1px solid var(--line)", borderRadius: 999, padding: "1px 7px" }} title="Respondió por el link abierto del grupo — normalmente un acompañante que no compró">
                  grupo
                </span>
              ) : null}
              <Stars v={r.stars} />
              {r.nps != null ? <span className="mut" style={{ fontSize: 12 }}>NPS {r.nps}</span> : null}
              <span className="mut" style={{ fontSize: 12, marginLeft: "auto" }}>{r.fecha}</span>
            </div>
          </div>
        ))}
        </div>
      </div>
      ))}
      {!lista.length ? <div className="empty">Nada con ese filtro.</div> : null}
    </div>
  );
}
