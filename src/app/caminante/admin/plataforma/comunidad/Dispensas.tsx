"use client";

// LAS DISPENSAS DE UNA OPERADORA, desde el lado de la casa.
//
// Vive junto a la revisión del expediente, en la misma ficha y con el mismo
// marcado (`.arr`, `.dl`, `.btn`): es la otra mitad de la misma pregunta —«¿ésta
// puede vender?»— cuando la respuesta honesta es «todavía no, pero yo lo
// autorizo mientras». Reusa lo que hay; no se diseñó nada.
//
// ⚠️ Una dispensa se ve SIEMPRE con su fecha, su motivo y quién la dio. Un
// permiso sin esos tres datos es un agujero, y la pantalla es donde eso se
// vuelve visible antes de que alguien lo olvide.

import { useState, useTransition } from "react";
import { ACTIVIDADES } from "@/lib/operadores/actividades";
import { otorgarDispensa, revocarDispensa } from "@/lib/operadores/expediente-actions";
import type { DispensaEnPantalla } from "@/lib/operadores/expediente";

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });

export default function Dispensas({ operadorId, lista }: { operadorId: string; lista: DispensaEnPantalla[] }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [actividad, setActividad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [venceEl, setVenceEl] = useState("");

  const vigentes = lista.filter((d) => d.vigente);
  const historia = lista.filter((d) => !d.vigente);

  const correr = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    arranca(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "No se pudo."));
      if (r.ok) {
        setActividad("");
        setMotivo("");
        setVenceEl("");
      }
    });

  return (
    <>
      <p className="arr">
        <s>Dispensas</s>
        <span>
          {vigentes.length
            ? `${vigentes.length} ${vigentes.length === 1 ? "actividad vende" : "actividades venden"} bajo dispensa tuya.`
            : "Ninguna actividad vende bajo dispensa."}
        </span>
      </p>

      {vigentes.length || historia.length ? (
        <dl className="dl">
          {vigentes.map((d) => (
            <div key={d.id}>
              <dt>Vigente</dt>
              <dd>
                <b>{d.nombre}</b> hasta el {fecha(d.venceAt)} · {d.motivo}
                <br />
                <span className="mut">La dio {d.autorizadaPor} el {fecha(d.autorizadaAt)}.</span>{" "}
                <button className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => correr(() => revocarDispensa(d.id))}>
                  Revocar
                </button>
              </dd>
            </div>
          ))}
          {historia.map((d) => (
            <div key={d.id}>
              <dt>{d.revocadaAt ? "Revocada" : "Vencida"}</dt>
              <dd>
                <span className="mut">
                  {d.nombre} · {d.motivo} · {d.revocadaAt ? `revocada el ${fecha(d.revocadaAt)}` : `venció el ${fecha(d.venceAt)}`}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <dl className="dl">
        <div>
          <dt>Dispensar</dt>
          <dd>
            <select value={actividad} onChange={(e) => setActividad(e.target.value)} disabled={pendiente}>
              <option value="">— actividad —</option>
              {ACTIVIDADES.map((a) => (
                <option key={a.slug} value={a.slug}>{a.nombre}</option>
              ))}
            </select>{" "}
            <input
              type="text"
              placeholder="Por qué (p. ej. «certificación de senderismo en trámite»)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={pendiente}
              style={{ minWidth: 280 }}
            />{" "}
            <input type="date" value={venceEl} onChange={(e) => setVenceEl(e.target.value)} disabled={pendiente} />{" "}
            <button
              className="btn btn-ghost btn-sm"
              // Sin los tres datos no se puede oprimir: el servidor también lo
              // rechaza, pero enterarse ANTES de intentar es lo decente.
              disabled={pendiente || !actividad || motivo.trim().length < 10 || !venceEl}
              onClick={() => correr(() => otorgarDispensa({ operadorId, actividad, motivo, venceEl }))}
            >
              {pendiente ? "Guardando…" : "Dispensar hasta esa fecha"}
            </button>
            <br />
            <span className="mut">
              Máximo 90 días. Vence sola; mientras, la actividad publica y vende aunque su expediente
              no esté aprobado, y la pantalla lo dice.
            </span>
          </dd>
        </div>
      </dl>
      {error ? <p className="arr"><s>Ojo</s><span>{error}</span></p> : null}
    </>
  );
}
