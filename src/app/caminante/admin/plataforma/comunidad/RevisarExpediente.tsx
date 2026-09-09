"use client";

// LA REVISIÓN DEL EXPEDIENTE, desde el lado de la casa.
//
// Vive DENTRO de la ficha de la operadora en Comunidad, y no en una pantalla
// nueva: es donde el admin ya viene a preguntarse «¿ésta puede vender?». Los
// candados de arriba dicen qué falta; esto es lo que él puede resolver aquí
// mismo. Reusa el marcado de la ficha (`.verdict`, `.dl`, `.btn`): no se diseñó
// nada, se vistió con lo que ya existe.

import { useState, useTransition } from "react";
import type { PorRevisar } from "@/lib/operadores/expediente";
import { resolverDocumento, resolverActividad } from "@/lib/operadores/expediente-actions";

export default function RevisarExpediente({ cola }: { cola: PorRevisar | undefined }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // ⚠️ El motivo se guarda POR documento. Con un solo campo compartido, rechazar
  // dos papeles seguidos les pondría a los dos la razón del último — y el motivo
  // es lo único que le dice a la operadora qué corregir.
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  if (!cola || (!cola.docs.length && !cola.actividades.length)) {
    return (
      <p className="arr">
        <s>Expediente</s>
        <span>Nada esperando revisión.</span>
      </p>
    );
  }

  const correr = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    arranca(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "No se pudo."));
    });

  return (
    <>
      <p className="arr">
        <s>Expediente</s>
        <span>
          {cola.docs.length
            ? `${cola.docs.length} ${cola.docs.length === 1 ? "documento espera" : "documentos esperan"} tu revisión.`
            : "Sin documentos pendientes."}
        </span>
      </p>

      <dl className="dl">
        {cola.docs.map((d) => (
          <div key={d.id}>
            <dt>{d.donde}</dt>
            <dd>
              <b>{d.nombre}</b>{" "}
              <a href={`/caminante/api/admin/expediente?path=${encodeURIComponent(d.archivoPath)}`} target="_blank" rel="noopener">
                Ver el archivo
              </a>
              <br />
              <button
                className="btn btn-ghost btn-sm"
                disabled={pendiente}
                onClick={() => correr(() => resolverDocumento(d.id, true))}
              >
                Aprobar
              </button>{" "}
              <input
                type="text"
                placeholder="Por qué se rechaza"
                value={motivos[d.id] ?? ""}
                onChange={(e) => setMotivos((m) => ({ ...m, [d.id]: e.target.value }))}
                disabled={pendiente}
              />{" "}
              <button
                className="btn btn-ghost btn-sm"
                // Sin motivo el botón no se puede oprimir: el servidor también lo
                // rechaza, pero enterarse ANTES de intentar es lo decente.
                disabled={pendiente || !(motivos[d.id] ?? "").trim()}
                onClick={() => correr(() => resolverDocumento(d.id, false, motivos[d.id]))}
              >
                Rechazar
              </button>
            </dd>
          </div>
        ))}

        {cola.actividades.map((a) => (
          <div key={a.actividad}>
            <dt>Actividad</dt>
            <dd>
              <b>{a.nombre}</b> pidió revisión.{" "}
              <button
                className="btn btn-ghost btn-sm"
                disabled={pendiente}
                onClick={() => correr(() => resolverActividad(cola.operatorId, a.actividad, true))}
              >
                Aprobar la actividad
              </button>{" "}
              <input
                type="text"
                placeholder="Por qué se devuelve"
                value={motivos[a.actividad] ?? ""}
                onChange={(e) => setMotivos((m) => ({ ...m, [a.actividad]: e.target.value }))}
                disabled={pendiente}
              />{" "}
              <button
                className="btn btn-ghost btn-sm"
                disabled={pendiente || !(motivos[a.actividad] ?? "").trim()}
                onClick={() =>
                  correr(() => resolverActividad(cola.operatorId, a.actividad, false, motivos[a.actividad]))
                }
              >
                Devolver
              </button>
            </dd>
          </div>
        ))}
      </dl>
      {error ? <p className="arr"><s>Ojo</s><span>{error}</span></p> : null}
    </>
  );
}
