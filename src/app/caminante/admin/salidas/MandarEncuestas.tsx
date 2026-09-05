"use client";

// El botón que le quita al cron el monopolio de que la encuesta salga.
// Ver `lib/feedback/disparo-manual.ts` para por qué existe.

import { useState } from "react";
import { dispararEncuestasAhora } from "@/lib/feedback/disparo-manual";

export default function MandarEncuestas() {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  return (
    <div
      className="card pad"
      style={{ marginBottom: 20, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}
    >
      <button
        type="button"
        className="btn btn-ghost"
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          setAviso(null);
          const r = await dispararEncuestasAhora();
          setAviso(r.ok ? { ok: true, texto: r.mensaje } : { ok: false, texto: r.error });
          setOcupado(false);
        }}
      >
        {ocupado ? "Mandando…" : "Mandar encuestas pendientes"}
      </button>
      <span className="mut" style={{ fontSize: 12.5, lineHeight: 1.5, flex: 1, minWidth: 240 }}>
        {aviso ? (
          <b style={{ color: aviso.ok ? "var(--olive)" : "#b33517" }}>{aviso.texto}</b>
        ) : (
          <>
            Manda la de toda salida que ya terminó y a la que ya le dieron las 19:30 en la ciudad de
            cada quien. Apretarlo dos veces no manda dos correos.
          </>
        )}
      </span>
    </div>
  );
}
