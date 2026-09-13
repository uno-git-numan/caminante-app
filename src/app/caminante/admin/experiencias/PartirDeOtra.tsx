"use client";

// PARTIR DE UNA QUE YA EXISTE — el hermano de «Pre-llenar con IA».
//
// Vive junto a él, en la misma tarjeta de arranque y con sus mismas piezas
// (`.startcard`, `.chip-auto`, `.sd-hint`), porque son la misma pregunta hecha
// de dos maneras: ¿de dónde sale el contenido de esta experiencia? De un PDF
// que me mandaron, o de una salida que ya hicimos.
//
// Sólo aparece al CREAR. En modo edición sería una trampa: invitaría a pisar la
// experiencia que estás editando con el contenido de otra.

import { useState, useTransition } from "react";
import { copiarExperiencia } from "@/lib/experiences/actions";
import { LO_QUE_NO_VIAJA, type Copiable } from "@/lib/experiences/copiar-contrato";
import type { Experience } from "@/lib/experiences/types";

type Props = {
  opciones: Copiable[];
  onCopia: (exp: Experience, origen: string) => void;
};

export default function PartirDeOtra({ opciones, onCopia }: Props) {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, arranca] = useTransition();

  // Sin nada de dónde partir no se enseña un selector vacío: para la casa no
  // pasa nunca, pero una operadora recién dada de alta no tiene ni una.
  if (!opciones.length) return null;

  function partir() {
    if (!slug) return;
    setError(null);
    arranca(async () => {
      const r = await copiarExperiencia(slug);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onCopia(r.exp, r.origen);
    });
  }

  return (
    <section className="startcard" style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="chip-auto">Copia</span>
        <strong>Partir de una que ya existe</strong>
        <span style={{ opacity: 0.6, fontSize: 13 }}>opcional</span>
      </div>
      <p className="sd-hint" style={{ marginTop: 6 }}>
        Trae el contenido completo de otra experiencia —fotos, ficha, aliados, itinerario,
        incluye/no incluye, mochila, FAQ y las cláusulas del deslinde— y lo deja aquí para que lo
        edites. Es para <b>otra salida al mismo lugar</b>: cambias el itinerario, el precio y las
        fechas, y lo demás ya está.
      </p>
      <p className="sd-hint" style={{ marginTop: 8 }}>
        <b>No viaja:</b> {LO_QUE_NO_VIAJA.join(" · ")}. La liga de pago se queda fuera a propósito —
        heredada, esta experiencia le cobraría al cliente la anterior. Las <b>salidas tampoco</b>:
        se dan de alta en Salidas, como siempre.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 10 }}>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={pendiente}
          style={{ maxWidth: 380 }}
        >
          <option value="">— elige de cuál partir —</option>
          {opciones.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.titulo}
              {o.donde ? ` · ${o.donde}` : ""}
              {o.publicada ? "" : " (borrador)"}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-orange btn-sm"
          disabled={!slug || pendiente}
          onClick={partir}
        >
          {pendiente ? "Trayendo…" : "Partir de esta"}
        </button>
      </div>

      {error ? (
        <p className="sd-hint" style={{ marginTop: 8, color: "var(--rust)" }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
