"use client";

// Botón de «Generar captions» con PROGRESO REAL.
//
// ⚠️ Antes esto era un <form action={serverAction}> de un solo tiro: la acción
// tardaba 101s, Vercel la mataba a los 60s y la página volvía IDÉNTICA. Un
// timeout era indistinguible de «no pasó nada» — el botón parecía muerto.
// Ahora el bucle vive en el CLIENTE: llama a la acción por lotes de 4, enseña
// «7 de 18…» mientras avanza, y si algo truena lo dice con el motivo Y con
// cuántas piezas alcanzaron a guardarse (que quedan en la base, no se pierden).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarLoteCaptions, listarPiezasListas } from "@/lib/kit/kit-actions";
import { LOTE_CAPTIONS } from "@/lib/kit/captions-lote";

type Estado =
  | { fase: "idle" }
  | { fase: "corriendo"; hechas: number; total: number }
  | { fase: "listo"; hechas: number }
  | { fase: "error"; motivo: string; hechas: number };

export default function CaptionsRunner({
  slug,
  yaTiene,
  etiqueta,
}: {
  slug: string;
  yaTiene: boolean;
  etiqueta?: string;
}) {
  const [st, setSt] = useState<Estado>({ fase: "idle" });
  const router = useRouter();

  async function correr() {
    setSt({ fase: "corriendo", hechas: 0, total: 0 });
    let hechas = 0;
    try {
      const ids = await listarPiezasListas(slug);
      if (!ids.length) {
        setSt({ fase: "error", motivo: "Ninguna pieza tiene sus insumos listos todavía.", hechas: 0 });
        return;
      }
      setSt({ fase: "corriendo", hechas: 0, total: ids.length });
      // SECUENCIAL a propósito: cada lote hace read-modify-write de data.kitCaptions;
      // en paralelo se pisarían entre ellos.
      for (let i = 0; i < ids.length; i += LOTE_CAPTIONS) {
        const lote = ids.slice(i, i + LOTE_CAPTIONS);
        const r = await generarLoteCaptions(slug, lote);
        if (!r.ok) {
          setSt({ fase: "error", motivo: r.error, hechas });
          router.refresh(); // lo ya generado SÍ quedó guardado: que se vea
          return;
        }
        hechas += r.ids.length;
        setSt({ fase: "corriendo", hechas, total: ids.length });
      }
      setSt({ fase: "listo", hechas });
      router.refresh();
    } catch (e) {
      // Red caída a media generación: los lotes anteriores ya están en la base.
      setSt({
        fase: "error",
        motivo: e instanceof Error ? e.message : "Se interrumpió la conexión.",
        hechas,
      });
      router.refresh();
    }
  }

  const corriendo = st.fase === "corriendo";
  return (
    <span className="caprun">
      <button type="button" className="btn btn-orange btn-sm" onClick={correr} disabled={corriendo}>
        {corriendo
          ? `⏳ Generando… ${st.hechas} de ${st.total || "?"}`
          : etiqueta || (yaTiene ? "↻ Regenerar captions" : "✨ Generar captions con IA")}
      </button>
      {st.fase === "listo" ? <span className="caprun-ok">✅ {st.hechas} captions generados</span> : null}
      {st.fase === "error" ? (
        <span className="caprun-err">
          ⚠️ {st.motivo}
          {st.hechas > 0 ? ` · ${st.hechas} piezas alcanzaron a guardarse` : ""}
        </span>
      ) : null}
    </span>
  );
}
